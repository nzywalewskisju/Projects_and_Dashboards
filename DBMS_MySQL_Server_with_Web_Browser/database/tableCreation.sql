  
  -- Joe Pepe, Oscar Nama, and Nick Zywalewski
  -- Database Management Systems
  -- 12/3/2025
  -- Final Project
  -- Purpose: Implement desired functionality to contribute to a simulated travel agency website and database
  


use travel_agency;





-- Table 1: cruise_line
create table cruise_line (
    cruise_id      int 				not null,
    cruise_name    varchar(100)      not null,
    origin         varchar(100)      not null,
    destination    varchar(100)      not null,
    departure_date date not null,
    arrival_date   date not null,
    ticket_price   decimal(10,2)     not null,   -- price in dollars

    constraint cruise_line_pk primary key (cruise_id)
);

-- Table 2: client
create table client (
    client_id    int			not null,
    client_name  varchar(100)   not null,
    dob          date,
    email        varchar(150)   not null,
    phone        varchar(25),
    
    constraint client_pk primary key (client_id)
);

-- Table 3: interests
create table interests (
    client_id int not null,
    interest   varchar(100) not null,

    -- One row per client per interest
    constraint interests_pk primary key (client_id, interest),

    constraint interests_client_fk
        foreign key (client_id)
        references client (client_id)
        on update cascade
        on delete cascade,
        
	constraint interest_check check (
        interest in ('Site-seeing', 'Good for Kids', 'Thrilling', 'Adults Only', 'Historical', 'Laid Back'))
);

-- Table 4: booking
-- many to many between client and cruise_line
create table booking (
    cruise_id    int not null,
    client_id    int not null,

    constraint booking_pk primary key (cruise_id, client_id),

    constraint booking_cruise_id_fk
        foreign key (cruise_id)
        references cruise_line (cruise_id)
            on delete cascade
            on update cascade,

    constraint booking_client_id_fk
        foreign key (client_id)
        references client (client_id)
            on delete cascade
            on update cascade
);

-- Table 5: cruise_category
-- categories match client interests like "site-seeing", "good for kids", etc.
create table cruise_category (
    cruise_id int         not null,
    category  varchar(50) not null,

    constraint cruise_category_pk primary key (cruise_id, category),

    constraint cruise_category_cruise_id_fk
        foreign key (cruise_id)
        references cruise_line (cruise_id)
            on delete cascade
            on update cascade,

    constraint cruise_category_check
        check (category in ('Site-seeing','Good for Kids','Thrilling','Adults Only','Historical','Laid Back'))
);

-- Table 6: users
create table users (
    username varchar(50) not null,
    pword varchar(50) not null,
    user_role varchar(50) not null,

    constraint users_pk primary key (username),
    
    constraint user_role_check
        check (user_role in ('Administrator','Team Member'))
);

-- Populate tables
insert into cruise_line (cruise_id,cruise_name,origin,destination,departure_date,arrival_date,ticket_price)
values
(1,'Caribbean Explorer','Miami','Bahamas','2025-12-01','2025-12-06',899.99),
(2,'Mediterranean Discovery','Barcelona','Rome','2025-12-10','2025-12-17',1299.50),
(3,'Historic Atlantic Journey','London','New York','2026-01-05','2026-01-15',1999.00),
(4,'Thrill Seekers Cruise','Sydney','Fiji','2026-02-01','2026-02-06',1499.75),
(5,'Relax and Recharge','San Juan','Aruba','2026-02-20','2026-02-26',1099.25),
(6,'Northern Lights Expedition','Reykjavik','Tromso','2026-03-05','2026-03-12',1899.00),
(7,'Family Fun Caribbean','Fort Lauderdale','Cozumel','2026-03-20','2026-03-25',999.99),
(8,'European Capitals Cruise','Amsterdam','Copenhagen','2026-04-01','2026-04-09',1599.50),
(9,'Alaskan Adventure','Seattle','Juneau','2026-05-10','2026-05-17',1799.00),
(10,'Adults Only Escape','Miami','St. Lucia','2026-06-01','2026-06-07',1399.00),
(11,'Greek Isles Getaway','Athens','Santorini','2026-06-20','2026-06-27',1499.50),
(12,'Baltic Heritage Cruise','Stockholm','Tallinn','2026-07-05','2026-07-12',1649.75),
(13,'Panama Canal Explorer','Miami','Panama City','2026-08-01','2026-08-10',2099.99),
(14,'South Pacific Dreams','Auckland','Tahiti','2026-09-01','2026-09-11',2499.99),
(15,'Iberian Coast Relaxer','Lisbon','Malaga','2026-09-20','2026-09-26',1299.99),
(16,'Holiday Caribbean Special','Miami','Barbados','2026-12-20','2026-12-27',1899.00),
(17,'New Year Celebration Cruise','Los Angeles','Cabo San Lucas','2026-12-28','2027-01-03',1599.00),
(18,'Historic Mediterranean Loop','Rome','Athens','2027-03-10','2027-03-18',1999.00),
(19,'Scenic Fjords Journey','Bergen','Geiranger','2027-05-01','2027-05-08',1899.50),
(20,'Laid Back Island Hopper','San Juan','St. Thomas','2027-06-10','2027-06-15',1199.25);

insert into client (client_id, client_name, dob, email, phone)
values
(101,'Julianne Bosco','2002-09-21','julianne.bosco@gmail.com','215-983-2476'),
(102,'Joe Garvey','1990-11-02','joegarvey@yahoo.com','609-412-3985'),
(103,'Alex Williamson','1985-04-21','alex.w12@outlook.com','267-531-8840'),
(104,'Mark Smith','2000-11-08','m.smith@gmail.com','484-120-7396'),
(105,'Daniel Lee','2001-06-30','d.lee@comcast.net','302-799-5613'),
(106,'Emily Carter','1994-02-14','ecarter@gmail.com','917-245-6081'),
(107,'Liam Johnson','1992-05-09','lj_92@aol.com','631-580-2134'),
(108,'Sophia Martinez','1998-07-22','soph.m@hotmail.com','773-942-6685'),
(109,'Noah Williams','1987-03-03','nwilliams87@gmail.com','414-335-2097'),
(110,'Ava Taylor','1999-01-19','ava.taylor@gmail.com','856-974-1203'),
(111,'Mason Brown','1993-09-10','mbrown@outlook.com','312-680-4591'),
(112,'Isabella Davis','1996-12-01','isa.d@outlook.com','917-406-8530'),
(113,'Ethan Wilson','1989-08-15','ethan.wil89@gmail.com','720-591-3648'),
(114,'Mia Anderson','2000-10-05','mia.a@gmail.com','505-233-9471'),
(115,'Logan Thomas','1995-06-25','lt_95@comvast.net','315-749-2860'),
(116,'Harper Moore','1997-03-30','h.moore@yahoo.com','678-520-9314'),
(117,'Jacob Martin','1984-11-11','jm_8411@gmail.com','858-639-2740'),
(118,'Amelia Jackson','1991-04-17','ajackson@gmail.com','281-905-4376'),
(119,'Michael White','1988-02-02','mwhite@hotmail.com','701-364-8925'),
(120,'Charlotte Harris','1999-09-29','char.harris99@gmail.com','901-713-5264'),
(121,'Benjamin Clark','1993-01-03','benj.clark@gmail.com','423-867-1940'),
(122,'Evelyn Lewis','1997-05-27','e.lewis@hotmail.com','319-452-7806'),
(123,'Henry Young','1986-07-04','hyoung@gmail.com','602-593-4182'),
(124,'Abigail King','1994-12-18','ab.king94@gmail.com','337-920-5318'),
(125,'Sebastian Wright','1992-06-08','seb.wright@yahoo.com','734-258-6091'),
(126,'Victoria Scott','1990-03-21','v.scott@gmail.com','808-613-9427'),
(127,'Jack Green','1995-01-15','jackg@gmail.com','503-774-3609'),
(128,'Lily Baker','1998-08-12','l.baker@hotmail.com','207-439-1852'),
(129,'Owen Adams','1987-10-26','oadams@gmail.com','414-798-2604'),
(130,'Grace Nelson','1996-11-30','gracen@yahoo.com','970-348-5197'),
(131,'Wyatt Hill','1991-09-09','wyatt.h91@gmail.com','210-934-6782'),
(132,'Chloe Rivera','1993-05-13','chloer@yahoo.com','708-413-5297'),
(133,'Luke Ramirez','1989-04-01','l.ramirez89@gmail.com','980-625-1304'),
(134,'Zoey Perez','1997-02-16','zoey.p97@hotmail.com','808-274-9635'),
(135,'David Campbell','1985-06-19','d.campbell@aol.com','928-510-3476'),
(136,'Hannah Mitchell','1994-07-07','h.mitchell@yahoo.com','651-709-8420'),
(137,'Carter Roberts','1992-02-24','croberts92@aol.com','762-398-4159'),
(138,'Nora Turner','1999-03-28','n.turner@hotmail.com','419-526-9703'),
(139,'Elijah Phillips','1990-12-06','e.phillips@gmail.com','478-260-3917'),
(140,'Zoey Evans','1996-01-23','z.evans@yahoo.com','336-874-2059'),
(141,'Julian Collins','1993-11-05','j.collins@gmail.com','413-520-6984'),
(142,'Penelope Stewart','1998-09-14','pen.stewart@aol.com','904-318-4726'),
(143,'Levi Sanchez','1991-10-20','levi.s@yahoo.com','919-607-5831'),
(144,'Aria Morris','1997-08-03','aria.m97@gmail.com','432-895-2107'),
(145,'Matthew Rogers','1988-05-18','m.rogers@gmail.com','715-942-3608'),
(146,'Stella Reed','1995-04-11','stella.r@yahoo.com','985-230-6741'),
(147,'Hudson Cook','1992-06-02','hcook@gmail.com','517-469-8023'),
(148,'Nolan Morgan','1986-01-28','n.morgan@gmail.com','606-583-1924'),
(149,'Riley Bell','1999-12-12','r.bell99@gmail.com','972-410-5382'),
(150,'Paisley Murphy','1998-07-31','paisley.m@hotmail.com','828-794-6105');

insert into interests (client_id, interest) values
(101,'Historical'),
(101,'Laid Back'),
(102,'Good for Kids'),
(102,'Site-seeing'),
(103,'Thrilling'),
(103,'Adults Only'),
(104,'Laid Back'),
(105,'Site-seeing'),
(105,'Historical'),
(105,'Good for Kids'),
(106,'Site-seeing'),
(106,'Laid Back'),
(107,'Good for Kids'),
(107,'Thrilling'),
(108,'Historical'),
(108,'Site-seeing'),
(109,'Thrilling'),
(110,'Laid Back'),
(110,'Site-seeing'),
(110,'Good for Kids'),
(111,'Good for Kids'),
(111,'Laid Back'),
(112,'Site-seeing'),
(113,'Historical'),
(113,'Adults Only'),
(114,'Laid Back'),
(114,'Historical'),
(115,'Thrilling'),
(115,'Site-seeing'),
(116,'Good for Kids'),
(116,'Site-seeing'),
(116,'Laid Back'),
(117,'Historical'),
(118,'Laid Back'),
(118,'Site-seeing'),
(119,'Adults Only'),
(119,'Thrilling'),
(120,'Historical'),
(120,'Site-seeing'),
(120,'Laid Back'),
(121,'Site-seeing'),
(121,'Good for Kids'),
(122,'Laid Back'),
(123,'Thrilling'),
(123,'Good for Kids'),
(124,'Good for Kids'),
(124,'Laid Back'),
(124,'Site-seeing'),
(125,'Historical'),
(125,'Adults Only'),
(125,'Laid Back'),
(126,'Site-seeing'),
(126,'Historical'),
(127,'Thrilling'),
(128,'Laid Back'),
(128,'Good for Kids'),
(129,'Adults Only'),
(129,'Historical'),
(130,'Site-seeing'),
(130,'Laid Back'),
(130,'Good for Kids'),
(131,'Historical'),
(132,'Good for Kids'),
(132,'Thrilling'),
(133,'Thrilling'),
(133,'Adults Only'),
(133,'Historical'),
(134,'Laid Back'),
(135,'Site-seeing'),
(135,'Historical'),
(136,'Good for Kids'),
(136,'Laid Back'),
(137,'Thrilling'),
(137,'Site-seeing'),
(137,'Adults Only'),
(138,'Historical'),
(138,'Laid Back'),
(139,'Adults Only'),
(140,'Site-seeing'),
(140,'Good for Kids'),
(140,'Laid Back'),
(141,'Laid Back'),
(141,'Site-seeing'),
(142,'Good for Kids'),
(142,'Historical'),
(143,'Thrilling'),
(144,'Historical'),
(144,'Laid Back'),
(144,'Site-seeing'),
(145,'Adults Only'),
(145,'Thrilling'),
(146,'Laid Back'),
(147,'Site-seeing'),
(148,'Good for Kids'),
(148,'Laid Back'),
(148,'Historical'),
(149,'Thrilling'),
(149,'Site-seeing'),
(150,'Historical'),
(150,'Laid Back'),
(150,'Good for Kids');

insert into booking (cruise_id, client_id)
values
(1,101),(1,102),(1,110),(1,124),
(2,105),(2,108),(2,120),
(3,101),(3,113),(3,117),(3,135),
(4,103),(4,115),(4,127),
(5,104),(5,118),(5,122),
(6,105),(6,130),
(7,102),(7,116),(7,121),(7,136),
(8,108),(8,120),
(9,109),(9,123),(9,149),
(10,103),(10,119),(10,137),
(11,105),(11,120),
(12,113),(12,126),
(13,120),(13,135),
(14,104),(14,118),
(15,104),
(16,102),(16,121),(16,140),
(17,119),(17,139),
(18,113),(18,144),
(19,118),(19,130),(19,138),
(20,104),(20,128);

insert into cruise_category (cruise_id, category)
values
(1,'Good for Kids'),(1,'Site-seeing'),(1,'Laid Back'),
(2,'Site-seeing'),(2,'Historical'),(2,'Laid Back'),
(3,'Historical'),(3,'Site-seeing'),
(4,'Thrilling'),(4,'Adults Only'),(4,'Site-seeing'),
(5,'Laid Back'),(5,'Site-seeing'),
(6,'Site-seeing'),(6,'Historical'),
(7,'Good for Kids'),(7,'Laid Back'),(7,'Site-seeing'),
(8,'Site-seeing'),(8,'Historical'),
(9,'Thrilling'),(9,'Site-seeing'),
(10,'Adults Only'),(10,'Thrilling'),(10,'Laid Back'),
(11,'Site-seeing'),(11,'Historical'),(11,'Laid Back'),
(12,'Historical'),(12,'Site-seeing'),
(13,'Site-seeing'),(13,'Historical'),(13,'Laid Back'),
(14,'Laid Back'),(14,'Site-seeing'),
(15,'Laid Back'),
(16,'Good for Kids'),(16,'Site-seeing'),
(17,'Adults Only'),(17,'Laid Back'),
(18,'Historical'),(18,'Site-seeing'),
(19,'Site-seeing'),(19,'Laid Back'),(19,'Historical'),
(20,'Laid Back');

insert into users (username, pword, user_role)
values
('nzywalewski26', 'iloveDBMS!', 'Administrator'),
('joeypepe', 'P@ssword1234','Team Member'),
('o.nama12', '#Databases','Team Member'),
('bforouraghi','iWillGiveThisGroupAnA+','Administrator'),
('katrina.c123', 'bells&whistles','Team Member');