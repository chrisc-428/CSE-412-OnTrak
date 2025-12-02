const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors())
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'CSE412GROUP20ONTRAK'; 

//Register
app.post('/api/register', async (req, res) => {
    const {registerEmail, registerUsername, registerPassword} = req.body;

    try {
    //Hash password for insertion (DISABLED FOR CLARITY)
    //const hashedPassword = await bcrypt.hash(password, 10);

    //Insert user into database
    const newUser = await pool.query(
      'INSERT INTO "User" (email, username, password) VALUES ($1, $2, $3) RETURNING *',
      [registerEmail, registerUsername, registerPassword] //hashedPassword]
    );

    return res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'Server error in register' });
    }
});

//Login
app.post('/api/login', async (req, res) => {
  const {loginEmail, loginPassword} = req.body;

    try {
        //Check for username with user/email
        const user = await pool.query('SELECT * FROM "User" WHERE email = $1 OR username = $1', [loginEmail]);

    if (user.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
    }

    //const validPassword = await bcrypt.compare(password, user.rows[0].password);
    //Compare unecrypted password for now
    const validPassword = (loginPassword == user.rows[0].password);

    if (!validPassword) {
        return res.status(402).json({ message: 'Invalid username/password' });
    }

    //Create JWT token for 24h if successful login w/ user info (username, email, etc.)
    const token = jwt.sign(
        { 
            userId: user.rows[0].userid,
            username: user.rows[0].username,
            email: user.rows[0].email
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    //Pass info to app
    res.json({
        token,
        userId: user.rows[0].userid,
        username: user.rows[0].username,
        email: user.rows[0].email
    });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'Server error in login' });
    }
});

//Get application table for user
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Missing token" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });

        req.user = user; //Gets userId, username, email
        next();
    });
}

//Get applications request
app.get('/api/get-applications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const results = await pool.query(
            'SELECT * FROM application WHERE userid = $1', [userId]);
        
        const applicationsWithInterviews = await Promise.all(
            results.rows.map(async (app) => {
                const interviewsResult = await pool.query(
                    `SELECT * FROM interview WHERE applicationid = $1`,
                    [app.applicationid]
                );
                app.interviews = interviewsResult.rows;
                return app;
            })
        );

        res.json(applicationsWithInterviews);
        //res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching applications" });
    }
});

//Create applications
app.post('/api/create-application', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, companyname, status, Date, jobtype, income, description } = req.body;

        const result = await pool.query(
            `INSERT INTO application (UserID, Name, CompanyName, Status, "Date", JobType, Income, Description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [userId, name, companyname, status, Date, jobtype, income, description]
        );

        //Update stats
        const application = result.rows[0];
        let statusColumn = '';
        switch (application.status) {
            case 'Applied':
                statusColumn = 'totalapplied';
                break;
            case 'Accepted':
                statusColumn = 'totalaccepted';
                break;
            case 'Rejected':
                statusColumn = 'totalrejected';
                break;
            case 'Round 1':
                statusColumn = 'totalfirstround';
                break;
            case 'Round 2':
                statusColumn = 'totalsecondround';
                break;
            case 'Round 3':
                statusColumn = 'totalthirdround';
                break;
        }
        await pool.query(
            `UPDATE analytics
            SET ${statusColumn} = ${statusColumn} + 1
            WHERE userid = $1`,
            [userId]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(505).json({ message: "Error creating application" });
    }
});

//Edit applications
app.put('/api/edit-application/:id', authenticateToken, async (req, res) => {
    const { name, userid, companyname, status, Date, jobtype, income, description, applicationid } = req.body;

    try {
        //Update analytics - subtract from old
        const getapp = await pool.query(
            `SELECT status FROM application WHERE applicationid = $1 AND userid = $2`,
            [applicationid, userid]
        );
        const application = getapp.rows[0];
        let statusColumn = '';
        switch (application.status) {
            case 'Applied':
                statusColumn = 'totalapplied';
                break;
            case 'Accepted':
                statusColumn = 'totalaccepted';
                break;
            case 'Rejected':
                statusColumn = 'totalrejected';
                break;
            case 'Round 1':
                statusColumn = 'totalfirstround';
                break;
            case 'Round 2':
                statusColumn = 'totalsecondround';
                break;
            case 'Round 3':
                statusColumn = 'totalthirdround';
                break;
        }
        await pool.query(
            `UPDATE analytics
            SET ${statusColumn} = GREATEST(0, ${statusColumn} - 1)
            WHERE userid = $1`,
            [userid]
        );

        const result = await pool.query(
            `UPDATE application 
             SET name=$1, companyname=$2, status=$3, "Date"=$4, jobtype=$5, income=$6, description=$7
             WHERE applicationid=$8 AND userid=$9 RETURNING *`,
            [name, companyname, status, Date, jobtype, income, description, applicationid, userid]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Application not found' });

        //Update analytics - add to new
        const statusMap = {
            'Applied': 'totalapplied',
            'Round 1': 'totalfirstround',
            'Round 2': 'totalsecondround',
            'Round 3': 'totalthirdround',
            'Accepted': 'totalaccepted',
            'Rejected': 'totalrejected'
        };

        const columnToUpdate = statusMap[status];

        if (columnToUpdate) {
            const updateAnalytics = await pool.query(
                `UPDATE analytics
                 SET ${columnToUpdate} = ${columnToUpdate} + 1, lastupdated = CURRENT_DATE
                 WHERE userid = $1
                 RETURNING *`,
                [userid]
            );

            if (updateAnalytics.rowCount === 0) {
                await pool.query(
                    `INSERT INTO analytics (userid, ${columnToUpdate}, lastupdated)
                     VALUES ($1, 1, CURRENT_DATE)`,
                    [userid]
                );
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating application' });
    }
});

//Delete applications
app.delete('/api/delete-application/:id', authenticateToken, async (req, res) => {
    const id = Number(req.params.id);

    const userId = req.user.userId;

    try {
        //Update stats
        const getapp = await pool.query(
            `SELECT status FROM application WHERE applicationid = $1 AND userid = $2`,
            [id, userId]
        );
        
        const application = getapp.rows[0];
        let statusColumn = '';
        switch (application.status) {
            case 'Applied':
                statusColumn = 'totalapplied';
                break;
            case 'Accepted':
                statusColumn = 'totalaccepted';
                break;
            case 'Rejected':
                statusColumn = 'totalrejected';
                break;
            case 'Round 1':
                statusColumn = 'totalfirstround';
                break;
            case 'Round 2':
                statusColumn = 'totalsecondround';
                break;
            case 'Round 3':
                statusColumn = 'totalthirdround';
                break;
        }
        await pool.query(
            `UPDATE analytics
            SET ${statusColumn} = GREATEST(0, ${statusColumn} - 1)
            WHERE userid = $1`,
            [userId]
        );

        const result = await pool.query(
            'DELETE FROM application WHERE applicationid=$1 AND userid=$2 RETURNING *',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Application not found' });

        res.json({ message: 'Application deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting application' });
    }
});

//Get analytics
app.get('/api/get-analytics', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            `SELECT * FROM analytics WHERE userid = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No analytics data found for this user' });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error while fetching analytics' });
    }
});

//Add interviews
app.post('/api/add-interview', authenticateToken, async (req, res) => {
    const { applicationid, roundnum, date, location, notes } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO interview (applicationid, roundnum, "Date", "Location", notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [applicationid, roundnum, date, location, notes]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding interview' });
    }
});

//Edit interviews
app.put('/api/edit-interview/:id', authenticateToken, async (req, res) => {
    const { roundnum, date, location, notes } = req.body;
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE interview
            SET roundnum = $1, "Date" = $2, "Location" = $3, notes = $4
            WHERE interviewid = $5
            RETURNING *`,
            [roundnum, date, location, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        res.json(result.rows[0]); // Return the updated interview
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating interview' });
    }
});

//Delete interviews
app.delete('/api/delete-interview/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM interview WHERE interviewid = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        res.json({ message: 'Interview deleted successfully' }); // Return success message
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting interview' });
    }
});

//Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});