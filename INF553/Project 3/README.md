# INF553 - Database Management Systems

## Web application over a database

1. Build a Web app which, given a database name:
    1. Shows to users the result of one of the queries in Question 3 _(see below)_
    2. Users should be able to click on any table names, and this should lead to a page showing the results of the queries in points 4, 5, and 7 above, restricted to that table.

<br/>

## Question 3

### Return the names of all the so-called user tables, that is: those that were not automatically created by Postgres.

### Propose three solutions:

1. A query over pg tables;
2. A query over pg class and another predefined system table.
3. A query over pg stat user tables.

**Note.** The views pg tables and pg stat user tables do not expose table IDs, that is: the internal unique identifiers that Postgres assigns to every table. In contrast, pg class does contain these IDs
