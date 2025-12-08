  /*
  Joe Pepe, Oscar Nama, and Nick Zywalewski
  Database Management Systems
  12/3/2025
  Final Project
  Purpose: Implement desired functionality to contribute to a simulated travel agency website and database
  */
//******************************************************************************  
//*** set up an HTTP server off port 3000
//******************************************************************************  
const express = require("express");
const app = express();
const port = 3000;
const open = require("open").default;

//******************************************************************************  
//*** set up mysql connections - using mysql2 and a pool
//******************************************************************************  
var mysql = require("mysql2");
require('dotenv').config({ path: '../.env' });


// Requires the exported pool object from the local 'mysql.js' file
const pool = require("../database/mysql");

//*** create form parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// SESSION SETUP
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

// Use your .env database credentials
const dbOptions = {
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

const sessionStore = new MySQLStore(dbOptions);

app.use(
    session({
        key: "travel_agency_session",
        secret: "superSecretString123!",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 2, // 2 hours
        },
    })
);




//******************************************************************************  
//*** File system module used for accessing files in nodejs (using promises API)
//******************************************************************************  
const fsp = require("fs").promises; // Using fs/promises for async/await
const path = require("path");

// needed for accessing images
app.use("/images", express.static(path.join(__dirname, "..", "client")));

// Modified to be async and use await fsp.readFile
async function readAndServe(pathName, res) {
    try {
        const data = await fsp.readFile(pathName);
        res.setHeader("Content-Type", "text/html");
        res.end(data);
    } catch (err) {
        console.error("File Read Error:", err);
        res.status(404).send(
            "<html><body><h1>404 Not Found</h1><p>The file " +
                pathName +
                " could not be served.</p></body></html>"
        );
    }
}

//******************************************************************************  
//*** routes
//******************************************************************************  

app.get("/login", async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "login.html");
    await readAndServe(filePath, res);
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = "SELECT * FROM users WHERE username = ? AND pword = ?";
    const params = [username, password];

    try {
        const [rows] = await pool.execute(sql, params);

        if (rows.length === 1) {
            // Save the user object into the session
            req.session.user = {
                username: rows[0].username,
                role: rows[0].user_role
            };

            console.log("LOGIN SUCCESS:", req.session.user);

            return res.redirect("/home");
        } else {
            return res.redirect("/login?error=1");

        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).send("Server error.");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) console.error("Logout error:", err);
        res.redirect("/login");
    });
});

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

function requireAdmin(req, res, next) {
    // Must be logged in first
    if (!req.session.user) {
        return res.redirect("/login");
    }

    // Check role
    if (req.session.user.role !== "Administrator") {
        const html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Access Denied</h3>
        <p>You do not have permission to access this page. Administrator privileges are required.</p>
        <br>
        <a href="/home">Back to Home</a><br>
        <a href="/logout">Sign Out</a>
        </body>
        </html>
        `;
        return res.status(403).send(html);
    }

    next();
}

// HOME PAGE: Travel Agency homepage
let login = false;
app.get("/home", requireLogin, async (req, res) => {
    if (!login) {
        console.log("Logged in user:", req.session.user.username);
        login = true;
    }
    

    const filePath = path.join(__dirname, "..", "client", "travelAgency.html");
    await readAndServe(filePath, res);
});


// CRUISES LANDING PAGE
app.get("/cruises", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "cruises", "cruises.html");
    await readAndServe(filePath, res);
});



// CRUISE SEARCH FORM PAGE
app.get("/cruise-search", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "cruises", "cruiseSearch.html");
    await readAndServe(filePath, res);
});

// CRUISE SEARCH RESULTS
app.post("/cruise-search", requireLogin, async (req, res) => {
    // get extract strings from browser or use an empty string
    const cruise_id = req.body.cruise_id || "";
    const cruiseName = req.body.cruiseName || "";
    const origin = req.body.origin || "";
    const destination = req.body.destination || "";

    const category1 = req.body.category1 || "";
    const category2 = req.body.category2 || "";
    const category3 = req.body.category3 || "";

    const departureFrom = req.body.departure_date_from || "";
    const departureTo = req.body.departure_date_to || "";
    const arrivalFrom = req.body.arrival_date_from || "";
    const arrivalTo = req.body.arrival_date_to || "";
    const lengthDaysMin = req.body.length_days_min || "";
    const lengthDaysMax = req.body.length_days_max || "";
    const ticketPriceMin = req.body.ticket_price_min || "";
    const ticketPriceMax = req.body.ticket_price_max || "";

    // concat fucntion allows all categories to show in the same column
    const cruiseSearchQuery = `
    select 
        cl.cruise_id as "Cruise ID",
        cl.cruise_name as "Cruise Name",
        cl.origin,
        cl.destination,
        cl.departure_date as "Departure Date",
        cl.arrival_date as "Arrival Date",
        DATEDIFF(cl.arrival_date, cl.departure_date) as "Length (Days)",
        cl.ticket_price as "Ticket Price",
        group_concat(cc.category order by cc.category separator ', ') as categories
    from cruise_line cl
    left join cruise_category cc
        on cl.cruise_id = cc.cruise_id
    where (? = '' or cl.cruise_id = ?)
        and cl.cruise_name like ?
        and cl.origin like ?
        and cl.destination like ?
        and (? = '' or cl.departure_date >= ?)
        and (? = '' or cl.departure_date <= ?)
        and (? = '' or cl.arrival_date >= ?)
        and (? = '' or cl.arrival_date <= ?)
        and (? = '' or DATEDIFF(cl.arrival_date, cl.departure_date) >= ?)
        and (? = '' or DATEDIFF(cl.arrival_date, cl.departure_date) <= ?)
        and (? = '' or cl.ticket_price >= ?)
        and (? = '' or cl.ticket_price <= ?)
        and (
            (? = '' and ? = '' and ? = '')
            or exists (
                select 1
                from cruise_category cc2
                where cc2.cruise_id = cl.cruise_id
                  and (
                      cc2.category = ?
                      or cc2.category = ?
                      or cc2.category = ?
                  )
            )
        )
    group by
        cl.cruise_id,
        cl.cruise_name,
        cl.origin,
        cl.destination,
        cl.departure_date,
        cl.arrival_date,
        cl.ticket_price
`;

    const cruiseSearchTerms = [
        cruise_id, cruise_id,
        "%" + cruiseName + "%",
        "%" + origin + "%",
        "%" + destination + "%",
        departureFrom, departureFrom,
        departureTo, departureTo,
        arrivalFrom, arrivalFrom,
        arrivalTo, arrivalTo,
        lengthDaysMin, lengthDaysMin,
        lengthDaysMax, lengthDaysMax,
        ticketPriceMin, ticketPriceMin,
        ticketPriceMax, ticketPriceMax,
        // emptiness check
        category1, category2, category3,
        // values used inside 'EXISTS'
        category1, category2, category3
    ];

    // old values that will fill the form when the user goes back
    const oldValues =
        "?cruise_id=" + encodeURIComponent(cruise_id) +
        "&cruiseName=" + encodeURIComponent(cruiseName) +
        "&origin=" + encodeURIComponent(origin) +
        "&destination=" + encodeURIComponent(destination) +
        "&category1=" + encodeURIComponent(category1) +
        "&category2=" + encodeURIComponent(category2) +
        "&category3=" + encodeURIComponent(category3) +
        "&departure_date_from=" + encodeURIComponent(departureFrom) +
        "&departure_date_to=" + encodeURIComponent(departureTo) +
        "&arrival_date_from=" + encodeURIComponent(arrivalFrom) +
        "&arrival_date_to=" + encodeURIComponent(arrivalTo) +
        "&length_days_min=" + encodeURIComponent(lengthDaysMin) +
        "&length_days_max=" + encodeURIComponent(lengthDaysMax) +
        "&ticket_price_min=" + encodeURIComponent(ticketPriceMin) +
        "&ticket_price_max=" + encodeURIComponent(ticketPriceMax);

    try {
        const [result, fields] = await pool.execute(cruiseSearchQuery, cruiseSearchTerms);

        let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
                table.std-table { border-collapse: collapse; margin-top: 8px; }
                table.std-table th, table.std-table td {
                    border: 1px solid black;
                    padding: 4px 8px;
                }
            </style>
            </head>
            <body>
            <h3>Cruise Search</h3>
            `;

            if (result.length > 0) {
                html += "<p><b>Search Results:</b></p>";
                html += `<table class="std-table"><tr>`;
                for (let i = 0; i < fields.length; i++) {
                    html += "<th>" + fields[i].name.toUpperCase() + "</th>";
                }
                html += "</tr>";

                for (let i = 0; i < result.length; i++) {
                    html += "<tr>";
                    for (let j = 0; j < fields.length; j++) {
                        const colName = fields[j].name;
                        let cellValue = result[i][colName];
                        if (cellValue instanceof Date) {
                            cellValue = cellValue.toISOString().split("T")[0];
                        }
                        html += "<td>" + (cellValue == null ? "" : cellValue) + "</td>";
                    }
                    html += "</tr>";
                }
                html += "</table>";
            } else {
                html += "<p>No cruises match your search criteria.</p>";
            }

            html += `
            <br><br>
            <a href="/cruise-search${oldValues}">Back to Search (keep values)</a><br>
            <a href="/cruise-search">Back to Search (reset)</a><br>
            <a href="/cruises">Back to Cruise Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;

        res.send(html);
    } catch (err) {
        console.error("SQL Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Search Error</h3>
        <p>There was an error running your search.</p>
        <br>
        <a href="/cruise-search${oldValues}">Back to Search (keep values)</a><br>
        <a href="/cruise-search">Back to Search (reset)</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});

// ------------------------------

// CRUISE ADD FORM PAGE
app.get("/cruise-add", requireAdmin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "cruises", "cruiseAdd.html");
    await readAndServe(filePath, res);
});

// HANDLE ADD CRUISE FORM SUBMISSION
app.post("/cruise-add", requireAdmin, async (req, res) => {
    const cruise_id = req.body.cruise_id;
    const cruise_name = req.body.cruise_name;
    const origin = req.body.origin;
    const destination = req.body.destination;
    const departure_date = req.body.departure_date;
    const arrival_date = req.body.arrival_date;
    const ticket_price = req.body.ticket_price;

    const category1 = req.body.category1;
    const category2 = req.body.category2;
    const category3 = req.body.category3;

    const cruiseInsertQuery = `
        insert into cruise_line
        (cruise_id, cruise_name, origin, destination,
         departure_date, arrival_date, ticket_price)
        values (?, ?, ?, ?, ?, ?, ?)
    `;

    const cruiseInsertTerms = [
        cruise_id,
        cruise_name,
        origin,
        destination,
        departure_date,
        arrival_date,
        ticket_price
    ];

    // compute length in days for display
    const departDateObj = new Date(departure_date);
    const arriveDateObj = new Date(arrival_date);
    const length_days_display = Math.round(
        (arriveDateObj - departDateObj) / (1000 * 60 * 60 * 24)
    );

    const insertCategoryQuery = `
        insert into cruise_category (cruise_id, category)
        values (?, ?)
    `;

    // Build query string with the values the user tried to submit
    const oldValues =
        "?cruise_id=" + encodeURIComponent(cruise_id) +
        "&cruise_name=" + encodeURIComponent(cruise_name) +
        "&origin=" + encodeURIComponent(origin) +
        "&destination=" + encodeURIComponent(destination) +
        "&departure_date=" + encodeURIComponent(departure_date) +
        "&arrival_date=" + encodeURIComponent(arrival_date) +
        "&ticket_price=" + encodeURIComponent(ticket_price) +
        "&category1=" + encodeURIComponent(category1) +
        "&category2=" + encodeURIComponent(category2) +
        "&category3=" + encodeURIComponent(category3);

    try {
        // insert cruise_line row
        await pool.execute(cruiseInsertQuery, cruiseInsertTerms);

        // insert required category1
        await pool.execute(insertCategoryQuery, [cruise_id, category1]);

        // insert optional category2 and category3 if filled
        if (category2 && category2.trim() !== "") {
            await pool.execute(insertCategoryQuery, [cruise_id, category2]);
        }
        if (category3 && category3.trim() !== "") {
            await pool.execute(insertCategoryQuery, [cruise_id, category3]);
        }

        // build a comma separated categories string for display
        const categoriesList = [category1, category2, category3]
            .filter(c => c && c.trim() !== "")
            .join(", ");

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Cruise Added Successfully</h3>
        <p>Cruise <b>${cruise_name}</b> was successfully added.</p>

        <table class="std-table">
            <tr>
                <th>Cruise ID</th><th>Cruise Name</th><th>Origin</th><th>Destination</th>
                <th>Departure Date</th><th>Arrival Date</th><th>Length (Days)</th><th>Ticket Price</th><th>Categories</th>
            </tr>
            <tr>
                <td>${cruise_id}</td>
                <td>${cruise_name}</td>
                <td>${origin}</td>
                <td>${destination}</td>
                <td>${departure_date}</td>
                <td>${arrival_date}</td>
                <td>${length_days_display}</td>
                <td>${ticket_price}</td>
                <td>${categoriesList}</td>
            </tr>
        </table>

        <br><br>
        <a href="/cruise-add">Add Another Cruise</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("SQL Insert Error:", err);

        let message = "There was a problem adding the cruise.";
        if (err.code === "ER_DUP_ENTRY") {
            message = "There was a problem adding the cruise. Make sure the Cruise ID is unique.";
        }

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Add Error</h3>
        <p>${message}</p>

        <br>
        <a href="/cruise-add${oldValues}">Back to Add Cruise (keep values)</a><br>
        <a href="/cruise-add">Back to Add Cruise (reset)</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});

// ------------------------------

// CRUISE UPDATE FORM PAGE
app.get("/cruise-update", requireAdmin,async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "cruises","cruiseUpdate.html");
    await readAndServe(filePath, res);
});
// HANDLE UPDATE CRUISE FORM SUBMISSION
app.post("/cruise-update", requireAdmin, async (req, res) => {
    const {
        cruise_id,
        cruise_name,
        origin,
        destination,
        departure_date,
        arrival_date,
        ticket_price,
        category1,
        category2,
        category3
    } = req.body;

    // Build dynamic UPDATE for cruise_line table
    let sql = "UPDATE cruise_line SET ";
    let params = [];
    let sets = [];

    if (cruise_name)     { sets.push("cruise_name = ?");   params.push(cruise_name); }
    if (origin)          { sets.push("origin = ?");        params.push(origin); }
    if (destination)     { sets.push("destination = ?");   params.push(destination); }
    if (departure_date)  { sets.push("departure_date = ?");params.push(departure_date); }
    if (arrival_date)    { sets.push("arrival_date = ?");  params.push(arrival_date); }
    if (ticket_price)    { sets.push("ticket_price = ?");  params.push(ticket_price); }

    // Categories provided in the form
    const categories = [category1, category2, category3]
        .map(c => (c || "").trim())
        .filter(c => c !== "");

    // For repopulation of values on error
    const q = new URLSearchParams(req.body).toString();

    // If no cruise fields and no categories provided
    if (sets.length === 0 && categories.length === 0) {
        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Update</h3>
        <p>No changes provided.</p>
        <br>
        <a href="/cruise-update?${q}">Back to Update Cruise (keep values)</a><br>
        <a href="/cruise-update">Back to Update Cruise (reset)</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;
        return res.send(html);
    }

    try {
        // If any cruise_line fields to update, run UPDATE
        if (sets.length > 0) {
            sql += sets.join(", ") + " WHERE cruise_id = ?";
            params.push(cruise_id);

            const [result] = await pool.execute(sql, params);

            if (result.affectedRows === 0) {
                let html = `
                <html>
                <head>
                <style>
                    body { font-family: arial; }
                    h3 { color: Tomato; }
                </style>
                </head>
                <body>
                <h3>Cruise Update</h3>
                <p>No cruise found with ID ${cruise_id}.</p>
                <br>
                <a href="/cruise-update?${q}">Back to Update Cruise (keep values)</a><br>
                <a href="/cruise-update">Back to Update Cruise (reset)</a><br>
                <a href="/cruises">Back to Cruise Options</a><br>
                <a href="/home">Back to Home</a>
                </body></html>
                `;
                return res.send(html);
            }
        }

        // If categories were provided, replace categories for this cruise
        if (categories.length > 0) {
            await pool.execute(
                "DELETE FROM cruise_category WHERE cruise_id = ?",
                [cruise_id]
            );

            let valuesClause = categories.map(() => "(?, ?)").join(", ");
            let insertSql = `
                INSERT INTO cruise_category (cruise_id, category)
                VALUES ${valuesClause}
            `;
            let catParams = [];
            categories.forEach(c => {
                catParams.push(cruise_id, c);
            });

            await pool.execute(insertSql, catParams);
        }

        // Now select the full, up to date cruise record, including categories
        const [rows] = await pool.execute(
            `
            SELECT 
                cl.cruise_id,
                cl.cruise_name,
                cl.origin,
                cl.destination,
                cl.departure_date,
                cl.arrival_date,
                DATEDIFF(cl.arrival_date, cl.departure_date) AS length_days,
                cl.ticket_price,
                GROUP_CONCAT(cc.category ORDER BY cc.category SEPARATOR ', ') AS categories
            FROM cruise_line cl
            LEFT JOIN cruise_category cc
                ON cl.cruise_id = cc.cruise_id
            WHERE cl.cruise_id = ?
            GROUP BY
                cl.cruise_id,
                cl.cruise_name,
                cl.origin,
                cl.destination,
                cl.departure_date,
                cl.arrival_date,
                cl.ticket_price
            `,
            [cruise_id]
        );

        if (rows.length === 0) {
            // Should be rare at this point, but handle it anyway
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>Cruise Update</h3>
            <p>No cruise found with ID ${cruise_id}.</p>
            <br>
            <a href="/cruise-update?${q}">Back to Update Cruise (keep values)</a><br>
            <a href="/cruise-update">Back to Update Cruise (reset)</a><br>
            <a href="/cruises">Back to Cruise Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        const r = rows[0];

        const depDateFormatted = r.departure_date instanceof Date
            ? r.departure_date.toISOString().split("T")[0]
            : (r.departure_date || "");

        const arrDateFormatted = r.arrival_date instanceof Date
            ? r.arrival_date.toISOString().split("T")[0]
            : (r.arrival_date || "");

        const categoriesList = r.categories || "";

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Cruise Updated Successfully</h3>
        <p>Cruise with ID <b>${cruise_id}</b> has been updated.</p>

        <table class="std-table">
            <tr>
                <th>Cruise ID</th>
                <th>Cruise Name</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Departure Date</th>
                <th>Arrival Date</th>
                <th>Length (Days)</th>
                <th>Ticket Price</th>
                <th>Categories</th>
            </tr>
            <tr>
                <td>${r.cruise_id}</td>
                <td>${r.cruise_name || ""}</td>
                <td>${r.origin || ""}</td>
                <td>${r.destination || ""}</td>
                <td>${depDateFormatted}</td>
                <td>${arrDateFormatted}</td>
                <td>${r.length_days != null ? r.length_days : ""}</td>
                <td>${r.ticket_price != null ? r.ticket_price : ""}</td>
                <td>${categoriesList}</td>
            </tr>
        </table>

        <br><br>
        <a href="/cruise-update">Update Another Cruise</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Cruise Update Error:", err);
        const q2 = new URLSearchParams(req.body).toString();

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Update Error</h3>
        <p>There was a problem updating the cruise.</p>
        <br>
        <a href="/cruise-update?${q2}">Back to Update Cruise (keep values)</a><br>
        <a href="/cruise-update">Back to Update Cruise (reset)</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});

// CRUISE DELETE FORM PAGE
app.get("/cruise-delete", requireAdmin, async (req, res) => {
    const path = require("path");
    const filePath = path.join(__dirname, "..", "client", "cruises", "cruiseDelete.html");
    res.sendFile(filePath);
});

// HANDLE DELETE CRUISE FORM SUBMISSION
app.post("/cruise-delete", requireAdmin, async (req, res) => {
    const cruise_id = req.body.cruise_id;

    const cruiseDeleteQuery = `
        delete from cruise_line
        where cruise_id = COALESCE(?, cruise_id)
    `;

    const cruiseDeleteTerms = [cruise_id];

    const oldValues = "?cruise_id=" + encodeURIComponent(cruise_id || "");

    try {
        const [result] = await pool.execute(cruiseDeleteQuery, cruiseDeleteTerms);

        if (result.affectedRows === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>No Cruise Deleted</h3>
            <p>No cruise found with ID ${cruise_id}.</p>
            <br>
            <a href="/cruise-delete${oldValues}">Back to Delete Cruise (keep values)</a><br>
            <a href="/cruise-delete">Back to Delete Cruise (reset)</a><br>
            <a href="/cruises">Back to Cruise Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Deleted Successfully</h3>
        <p>Cruise with ID ${cruise_id} has been deleted.</p>
        <p>Related bookings and categories have also been removed.</p>

        <br>
        <a href="/cruise-delete">Delete Another Cruise</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("SQL Delete Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Cruise Delete Error</h3>
        <p>There was a problem deleting the cruise.</p>
        <br>
        <a href="/cruise-delete${oldValues}">Back to Delete Cruise (keep values)</a><br>
        <a href="/cruise-delete">Back to Delete Cruise (reset)</a><br>
        <a href="/cruises">Back to Cruise Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});



// BOOKINGS LANDING PAGE
app.get("/bookings", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "bookings", "bookings.html");
    await readAndServe(filePath, res);
});


// BOOKING SEARCH FORM PAGE
app.get("/booking-search", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "bookings", "bookingSearch.html");
    await readAndServe(filePath, res);
});

// BOOKING SEARCH RESULTS
app.post("/booking-search", requireLogin, async (req, res) => {
    
    const clientId   = req.body.clientId   || "";
    const clientName = req.body.clientName || "";
    const cruiseId   = req.body.cruiseId   || "";
    const cruiseName = req.body.cruiseName || "";

    const bookingSearchQuery = `
        select b.client_id as "Client ID", 
        c.client_name as "Client Name", 
        b.cruise_id as "Cruise ID", 
        cl.cruise_name as "Cruise Name"
        from booking b
        join client c on b.client_id = c.client_id
        join cruise_line cl on b.cruise_id = cl.cruise_id
        where
            (? = '' or b.client_id = ?)
            and (? = '' or c.client_name like ?)
            and (? = '' or b.cruise_id = ?)
            and (? = '' or cl.cruise_name like ?)
        order by b.client_id, b.cruise_id
    `;

    const bookingSearchTerms = [
        clientId, clientId,
        clientName, "%" + clientName + "%",
        cruiseId, cruiseId,
        cruiseName, "%" + cruiseName + "%"
    ];

    // keep old values so search form is prefilled if they go back
    const oldValues =
        "?clientId=" + encodeURIComponent(clientId) +
        "&clientName=" + encodeURIComponent(clientName) +
        "&cruiseId=" + encodeURIComponent(cruiseId) +
        "&cruiseName=" + encodeURIComponent(cruiseName);

    try {
        const [result, fields] = await pool.execute(bookingSearchQuery, bookingSearchTerms);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Booking Search</h3>
        `;

        if (result.length > 0) {
            html += "<p><b>Search Results:</b></p>";
            html += "<table class='std-table'><tr>";
            for (let i = 0; i < fields.length; i++) {
                html += "<th>" + fields[i].name.toUpperCase() + "</th>";
            }
            html += "</tr>";

            for (let i = 0; i < result.length; i++) {
                html += "<tr>";
                for (let j = 0; j < fields.length; j++) {
                    const colName = fields[j].name;
                    const cellValue = result[i][colName];
                    html += "<td>" + (cellValue == null ? "" : cellValue) + "</td>";
                }
                html += "</tr>";
            }
            html += "</table>";
        } else {
            html += "<p>No bookings match your search criteria.</p>";
        }

        html += `
        <br><br>
        <a href="/booking-search${oldValues}">Back to Search (keep values)</a><br>
        <a href="/booking-search">Back to Search (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Booking SQL Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Booking Search Error</h3>
        <p>There was an error running your booking search.</p>
        <br>
        <a href="/booking-search${oldValues}">Back to Search (keep values)</a><br>
        <a href="/booking-search">Back to Search (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});



// BOOKING ADD FORM PAGE
app.get("/booking-add", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname,"..","client", "bookings", "bookingAdd.html");
    await readAndServe(filePath, res);
});

// HANDLE ADD BOOKING FORM SUBMISSION
app.post("/booking-add", requireLogin, async (req, res) => {
    const client_id = req.body.client_id;
    const cruise_id = req.body.cruise_id;

    const bookingInsertQuery = `
        INSERT INTO booking (cruise_id, client_id)
        VALUES (?, ?)
    `;

    const bookingInsertTerms = [cruise_id, client_id];

    const oldValues =
        "?client_id=" + encodeURIComponent(client_id) +
        "&cruise_id=" + encodeURIComponent(cruise_id);

    try {
        // insert booking row
        await pool.execute(bookingInsertQuery, bookingInsertTerms);

        // select joined info to display nice confirmation
        const selectQuery = `
            SELECT 
                b.client_id      AS client_id,
                c.client_name    AS client_name,
                b.cruise_id      AS cruise_id,
                cl.cruise_name   AS cruise_name
            FROM booking b
            JOIN cruise_line cl ON b.cruise_id = cl.cruise_id
            JOIN client c      ON b.client_id = c.client_id
            WHERE b.cruise_id = ? 
              AND b.client_id = ?
        `;

        const [rows] = await pool.execute(selectQuery, [cruise_id, client_id]);

        if (rows.length === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>Booking Add</h3>
            <p>Booking was inserted but could not be found for display.</p>

            <br>
            <a href="/booking-add${oldValues}">Back to Add Booking (keep values)</a><br>
            <a href="/booking-add">Back to Add Booking (reset)</a><br>
            <a href="/bookings">Back to Booking Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        const row = rows[0];

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Booking Added Successfully</h3>
        <p>Booking with Client ID <b>${row.client_id}</b> and Cruise ID <b>${row.cruise_id}</b> was successfully added.</p>

        <table class="std-table">
            <tr>
                <th>Client ID</th>
                <th>Client Name</th>
                <th>Cruise ID</th>
                <th>Cruise Name</th>
            </tr>
            <tr>
                <td>${row.client_id}</td>
                <td>${row.client_name}</td>
                <td>${row.cruise_id}</td>
                <td>${row.cruise_name}</td>
            </tr>
        </table>

        <br><br>
        <a href="/booking-add">Add Another Booking</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Booking Insert Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Booking Add Error</h3>
        <p>There was a problem adding the booking. Make sure the Cruise ID and Client ID exist and that this booking is not already in the system.</p>

        <br>
        <a href="/booking-add${oldValues}">Back to Add Booking (keep values)</a><br>
        <a href="/booking-add">Back to Add Booking (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});



// BOOKING CHANGE FORM PAGE
app.get("/booking-change", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "bookings", "bookingChange.html");
    await readAndServe(filePath, res);
});


// HANDLE CHANGE BOOKING FORM SUBMISSION
app.post("/booking-change", requireLogin, async (req, res) => {
    const client_id     = req.body.client_id;
    const old_cruise_id = req.body.old_cruise_id;
    const new_cruise_id = req.body.new_cruise_id;

    // build query string so we can repopulate the form on error
    const oldValues =
        "?client_id=" + encodeURIComponent(client_id) +
        "&old_cruise_id=" + encodeURIComponent(old_cruise_id) +
        "&new_cruise_id=" + encodeURIComponent(new_cruise_id);

    // simple protection if new cruise id is missing
    if (!new_cruise_id || new_cruise_id.trim() === "") {
        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>New Cruise ID Required</h3>
        <p>Please enter a New Cruise ID.</p>
        <br>
        <a href="/booking-change${oldValues}">Back to Change Booking (keep values)</a><br>
        <a href="/booking-change">Back to Change Booking (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;
        return res.send(html);
    }

    const bookingUpdateQuery = `
        UPDATE booking
        SET cruise_id = ?
        WHERE client_id = ? 
          AND cruise_id = ?
    `;

    const bookingUpdateTerms = [new_cruise_id, client_id, old_cruise_id];

    try {
        const [updateResult] = await pool.execute(bookingUpdateQuery, bookingUpdateTerms);

        if (updateResult.affectedRows === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>Booking Not Found</h3>
            <p>No booking found with Client ID ${client_id} and Cruise ID ${old_cruise_id}.</p>
            <br>
            <a href="/booking-change${oldValues}">Back to Change Booking (keep values)</a><br>
            <a href="/booking-change">Back to Change Booking (reset)</a><br>
            <a href="/bookings">Back to Booking Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        // get the updated booking for confirmation
        const selectQuery = `
            SELECT 
                b.client_id    AS client_id,
                c.client_name  AS client_name,
                b.cruise_id    AS cruise_id,
                cl.cruise_name AS cruise_name
            FROM booking b
            JOIN client c      ON b.client_id = c.client_id
            JOIN cruise_line cl ON b.cruise_id = cl.cruise_id
            WHERE b.client_id = ? 
              AND b.cruise_id = ?
        `;

        const [rows] = await pool.execute(selectQuery, [client_id, new_cruise_id]);

        if (rows.length === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>Booking Changed</h3>
            <p>The booking was updated, but the updated record could not be retrieved for display.</p>
            <br>
            <a href="/booking-change">Change Another Booking</a><br>
            <a href="/bookings">Back to Booking Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        const row = rows[0];

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Booking Changed Successfully</h3>
        <p>Booking has been changed to the new cruise shown below.</p>

        <table class="std-table">
            <tr>
                <th>Client ID</th>
                <th>Client Name</th>
                <th>Cruise ID</th>
                <th>Cruise Name</th>
            </tr>
            <tr>
                <td>${row.client_id}</td>
                <td>${row.client_name}</td>
                <td>${row.cruise_id}</td>
                <td>${row.cruise_name}</td>
            </tr>
        </table>

        <br><br>
        <a href="/booking-change">Change Another Booking</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Booking Update Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Booking Change Error</h3>
        <p>There was a problem changing the booking. Make sure the new Cruise ID exists and that this change does not conflict with another booking.</p>
        <br>
        <a href="/booking-change${oldValues}">Back to Change Booking (keep values)</a><br>
        <a href="/booking-change">Back to Change Booking (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});


// BOOKING DELETE FORM PAGE
app.get("/booking-delete", requireLogin,async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "bookings", "bookingDelete.html");
    await readAndServe(filePath, res);
});

// HANDLE DELETE BOOKING FORM SUBMISSION
app.post("/booking-delete", requireLogin, async (req, res) => {
    const client_id = req.body.client_id;
    const cruise_id = req.body.cruise_id;

    const bookingDeleteQuery = `
        delete from booking
        where client_id = ? and cruise_id = ?
    `;

    const bookingDeleteTerms = [client_id, cruise_id];

    const oldValues =
        "?client_id=" + encodeURIComponent(client_id || "") +
        "&cruise_id=" + encodeURIComponent(cruise_id || "");

    try {
        const [result] = await pool.execute(bookingDeleteQuery, bookingDeleteTerms);

        // If the booking was not found, tell the user.
        if (result.affectedRows === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>No Booking Deleted</h3>
            <p>No booking found with Client ID ${client_id} and Cruise ID ${cruise_id}.</p>
            <br>
            <a href="/booking-delete${oldValues}">Back to Delete Booking (keep values)</a><br>
            <a href="/booking-delete">Back to Delete Booking (reset)</a><br>
            <a href="/bookings">Back to Booking Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Booking Deleted Successfully</h3>
        <p>The booking for Client ID ${client_id} on Cruise ID ${cruise_id} has been deleted.</p>

        <br>
        <a href="/booking-delete">Delete Another Booking</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Booking Delete Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Booking Delete Error</h3>
        <p>There was a problem deleting the booking.</p>
        <br>
        <a href="/booking-delete${oldValues}">Back to Delete Booking (keep values)</a><br>
        <a href="/booking-delete">Back to Delete Booking (reset)</a><br>
        <a href="/bookings">Back to Booking Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});



// CLIENTS LANDING PAGE
app.get("/clients", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "clients", "clients.html");
    await readAndServe(filePath, res);
});


// CLIENTS SEARCH LANDING PAGE
app.get("/client-search", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "clients", "clientSearch.html");
    await readAndServe(filePath, res);
});

// CLIENT SEARCH RESULTS
app.post("/client-search", requireLogin, async (req, res) => {

    const clientId   = req.body.client_id || "";
    const clientName = req.body.client_name || "";
    const email      = req.body.email || "";
    const phone      = req.body.phone || "";
    const dobFrom    = req.body.dob_from || "";
    const dobTo      = req.body.dob_to || "";
    const interest1  = req.body.interest1 || "";
    const interest2  = req.body.interest2 || "";
    const interest3  = req.body.interest3 || "";

    const sql = `
        SELECT 
            c.client_id as "Client ID",
            c.client_name as "Client Name",
            c.dob as "Date of Birth",
            c.email as "Email",
            c.phone as "Phone",
            GROUP_CONCAT(i.interest ORDER BY i.interest SEPARATOR ', ') AS interests
        FROM client c
        LEFT JOIN interests i
            ON c.client_id = i.client_id
        WHERE (? = '' OR c.client_id = ?)
        AND c.client_name LIKE ?
          AND c.email LIKE ?
          AND c.phone LIKE ?
          AND (? = '' OR c.dob >= ?)
          AND (? = '' OR c.dob <= ?)
          AND (
                (? = '' AND ? = '' AND ? = '')
                OR EXISTS (
                    SELECT 1
                    FROM interests i2
                    WHERE i2.client_id = c.client_id
                      AND (
                          i2.interest = ?
                          OR i2.interest = ?
                          OR i2.interest = ?
                      )
                )
          )
        GROUP BY c.client_id, c.client_name, c.dob, c.email, c.phone
        ORDER BY c.client_id
    `;

    const params = [
        clientId, clientId,
        `%${clientName}%`,
        `%${email}%`,
        `%${phone}%`,
        dobFrom, dobFrom,
        dobTo, dobTo,
        // emptiness check for interests
        interest1, interest2, interest3,
        // values used inside EXISTS
        interest1, interest2, interest3
    ];

    const oldValues =
        "?client_id=" + encodeURIComponent(clientId) +
        "&client_name=" + encodeURIComponent(clientName) +
        "&email=" + encodeURIComponent(email) +
        "&phone=" + encodeURIComponent(phone) +
        "&dob_from=" + encodeURIComponent(dobFrom) +
        "&dob_to=" + encodeURIComponent(dobTo) +
        "&interest1=" + encodeURIComponent(interest1) +
        "&interest2=" + encodeURIComponent(interest2) +
        "&interest3=" + encodeURIComponent(interest3);

    try {
        const [rows, fields] = await pool.execute(sql, params);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Client Search</h3>
        `;

        if (rows.length > 0) {
            html += "<p><b>Search Results:</b></p>";
            html += "<table class='std-table'><tr>";
            fields.forEach(f => {
                html += `<th>${f.name.toUpperCase()}</th>`;
            });
            html += "</tr>";

            rows.forEach(r => {
                html += "<tr>";
                fields.forEach(f => {
                    let v = r[f.name];
                    if (v instanceof Date) v = v.toISOString().split("T")[0];
                    html += `<td>${v ?? ""}</td>`;
                });
                html += "</tr>";
            });
            html += "</table>";
        } else {
            html += "<p>No clients matched your search.</p>";
        }

        html += `
        <br><br>
        <a href="/client-search${oldValues}">Back to Search (keep values)</a><br>
        <a href="/client-search">Back to Search (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Client Search Error:", err);
        
        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Search Error</h3>
        <p>There was an error running your client search.</p>
        <br>
        <a href="/client-search${oldValues}">Back to Search (keep values)</a><br>
        <a href="/client-search">Back to Search (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});



// CLIENT ADD FORM PAGE
app.get("/client-add", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "clients", "clientAdd.html");
    await readAndServe(filePath, res);
});


// HANDLE ADD CLIENT FORM SUBMISSION
app.post("/client-add", requireLogin, async (req, res) => {
    const { client_id, client_name, dob, email, phone,
            interest1, interest2, interest3 } = req.body;

    const sqlClient = `
        INSERT INTO client
        (client_id, client_name, dob, email, phone)
        VALUES (?, ?, ?, ?, ?)
    `;

    const clientParams = [
        client_id,
        client_name,
        dob || null,
        email,
        phone || null
    ];

    const q = new URLSearchParams(req.body).toString();

    // Build interests array from the three fields
    const interestsArray = [interest1, interest2, interest3]
        .filter(i => i && i.trim() !== "");

    try {
        // Insert into client
        await pool.execute(sqlClient, clientParams);

        // Insert interests if any were provided
        if (interestsArray.length > 0) {
            let valuesClause = interestsArray.map(() => "(?, ?)").join(", ");
            let sqlInterests = `
                INSERT INTO interests (client_id, interest)
                VALUES ${valuesClause}
            `;
            let interestParams = [];
            interestsArray.forEach(i => {
                interestParams.push(client_id, i);
            });
            await pool.execute(sqlInterests, interestParams);
        }

        // Build comma separated interests list for display
        const interestsList = interestsArray.join(", ");

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Client Added Successfully</h3>
        <p>Client <b>${client_name}</b> was successfully added.</p>

        <table class="std-table">
            <tr>
                <th>Client ID</th>
                <th>Client Name</th>
                <th>Date of Birth</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Interests</th>
            </tr>
            <tr>
                <td>${client_id}</td>
                <td>${client_name}</td>
                <td>${dob || ""}</td>
                <td>${email}</td>
                <td>${phone || ""}</td>
                <td>${interestsList}</td>
            </tr>
        </table>

        <br><br>
        <a href="/client-add">Add Another Client</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Client Add Error:", err);

        let message = "There was a problem adding the client.";
        if (err.code === "ER_DUP_ENTRY") {
            message = "There was a problem adding the client. Make sure the Client ID is unique.";
        }

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Add Error</h3>
        <p>${message}</p>

        <br>
        <a href="/client-add?${q}">Back to Add Client (keep values)</a><br>
        <a href="/client-add">Back to Add Client (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});


// CLIENT UPDATE FORM PAGE
app.get("/client-update", requireLogin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "clients", "clientUpdate.html");
    await readAndServe(filePath, res);
});


// HANDLE UPDATE CLIENT FORM SUBMISSION
app.post("/client-update", requireLogin, async (req, res) => {
    const { client_id, client_name, dob, email, phone,
            interest1, interest2, interest3 } = req.body;

    // Build dynamic UPDATE for client table (no interests here)
    let sql = "UPDATE client SET ";
    let params = [];
    let sets = [];

    if (client_name)  { sets.push("client_name=?"); params.push(client_name); }
    if (dob)          { sets.push("dob=?");         params.push(dob); }
    if (email)        { sets.push("email=?");       params.push(email); }
    if (phone)        { sets.push("phone=?");       params.push(phone); }

    // Build interests array for interests table
    const interestsArray = [interest1, interest2, interest3]
        .filter(i => i && i.trim() !== "");

    const q = new URLSearchParams(req.body).toString();

    // If nothing at all was provided ex.(no client fields, no interests)
    if (sets.length === 0 && interestsArray.length === 0) {
        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Update</h3>
        <p>No changes provided.</p>
        <br>
        <a href="/client-update?${q}">Back to Update Client (keep values)</a><br>
        <a href="/client-update">Back to Update Client (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;
        return res.send(html);
    }

    try {
        // If client fields to update, run UPDATE on client
        if (sets.length > 0) {
            sql += sets.join(", ") + " WHERE client_id=?";
            params.push(client_id);

            const [result] = await pool.execute(sql, params);
            if (result.affectedRows === 0) {
                let html = `
                <html>
                <head>
                <style>
                    body { font-family: arial; }
                    h3 { color: Tomato; }
                </style>
                </head>
                <body>
                <h3>Client Update</h3>
                <p>No client with that ID.</p>
                <br>
                <a href="/client-update?${q}">Back to Update Client (keep values)</a><br>
                <a href="/client-update">Back to Update Client (reset)</a><br>
                <a href="/clients">Back to Client Options</a><br>
                <a href="/home">Back to Home</a>
                </body></html>
                `;
                return res.send(html);
            }
        }

        // If interests were provided, replace interests for this client
        if (interestsArray.length > 0) {
            // Remove existing interests for this client
            await pool.execute(
                "DELETE FROM interests WHERE client_id = ?",
                [client_id]
            );

            // Insert new interests
            let valuesClause = interestsArray.map(() => "(?, ?)").join(", ");
            let insertSql = `
                INSERT INTO interests (client_id, interest)
                VALUES ${valuesClause}
            `;
            let interestParams = [];
            interestsArray.forEach(i => {
                interestParams.push(client_id, i);
            });

            await pool.execute(insertSql, interestParams);
        }

        //select the full, up to date client record
        const [rows] = await pool.execute(
            `
            SELECT 
                c.client_id,
                c.client_name,
                c.dob,
                c.email,
                c.phone,
                GROUP_CONCAT(i.interest ORDER BY i.interest SEPARATOR ', ') AS interests
            FROM client c
            LEFT JOIN interests i 
                ON c.client_id = i.client_id
            WHERE c.client_id = ?
            GROUP BY 
                c.client_id,
                c.client_name,
                c.dob,
                c.email,
                c.phone
            `,
            [client_id]
        );

        if (rows.length === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>Client Update</h3>
            <p>No client with that ID.</p>
            <br>
            <a href="/client-update?${q}">Back to Update Client (keep values)</a><br>
            <a href="/client-update">Back to Update Client (reset)</a><br>
            <a href="/clients">Back to Client Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        const r = rows[0];
        const dobFormatted = r.dob instanceof Date
            ? r.dob.toISOString().split("T")[0]
            : (r.dob || "");

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
            table.std-table { border-collapse: collapse; margin-top: 8px; }
            table.std-table th, table.std-table td {
                border: 1px solid black;
                padding: 4px 8px;
            }
        </style>
        </head>
        <body>
        <h3>Client Updated Successfully</h3>
        <p>Client has been updated.</p>

        <table class="std-table">
            <tr>
                <th>Client ID</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Interests</th>
            </tr>
            <tr>
                <td>${r.client_id}</td>
                <td>${r.client_name || ""}</td>
                <td>${dobFormatted}</td>
                <td>${r.email || ""}</td>
                <td>${r.phone || ""}</td>
                <td>${r.interests || ""}</td>
            </tr>
        </table>

        <br><br>
        <a href="/client-update">Update Another Client</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Client Update Error:", err);
        const q2 = new URLSearchParams(req.body).toString();

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Update Error</h3>
        <p>There was a problem updating the client.</p>
        <br>
        <a href="/client-update?${q2}">Back to Update Client (keep values)</a><br>
        <a href="/client-update">Back to Update Client (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});


// CLIENT DELETE FORM PAGE
app.get("/client-delete", requireAdmin, async (req, res) => {
    const filePath = path.join(__dirname, "..", "client", "clients", "clientDelete.html");
    await readAndServe(filePath, res);
});


// HANDLE DELETE CLIENT FORM SUBMISSION
app.post("/client-delete", requireAdmin, async (req, res) => {
    const { client_id } = req.body;

    const oldValues = "?client_id=" + encodeURIComponent(client_id || "");

    try {
        const [result] = await pool.execute(
            "DELETE FROM client WHERE client_id = ?",
            [client_id]
        );

        if (result.affectedRows === 0) {
            let html = `
            <html>
            <head>
            <style>
                body { font-family: arial; }
                h3 { color: Tomato; }
            </style>
            </head>
            <body>
            <h3>No Client Deleted</h3>
            <p>No client found with that ID.</p>
            <br>
            <a href="/client-delete${oldValues}">Back to Delete Client (keep values)</a><br>
            <a href="/client-delete">Back to Delete Client (reset)</a><br>
            <a href="/clients">Back to Client Options</a><br>
            <a href="/home">Back to Home</a>
            </body></html>
            `;
            return res.send(html);
        }

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Deleted Successfully</h3>
        <p>Client with ID ${client_id} has been deleted.</p>

        <br>
        <a href="/client-delete">Delete Another Client</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.send(html);

    } catch (err) {
        console.error("Client Delete Error:", err);

        let html = `
        <html>
        <head>
        <style>
            body { font-family: arial; }
            h3 { color: Tomato; }
        </style>
        </head>
        <body>
        <h3>Client Delete Error</h3>
        <p>There was a problem deleting the client.</p>
        <br>
        <a href="/client-delete${oldValues}">Back to Delete Client (keep values)</a><br>
        <a href="/client-delete">Back to Delete Client (reset)</a><br>
        <a href="/clients">Back to Client Options</a><br>
        <a href="/home">Back to Home</a>
        </body></html>
        `;

        res.status(500).send(html);
    }
});

// ----------------------------------------------------------------------------------------------

//*** server waits indefinitely for incoming requests
app.listen(port, async function () {
    console.log("Travel Agency app listening on port " + port);

    // Automatically open the login page in default browser
    await open(`http://localhost:${port}/login`);
});