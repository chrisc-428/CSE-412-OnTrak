import {useEffect, useState} from "react";
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {Pie} from 'react-chartjs-2';
import {Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

export default function Home() {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [isCreateEditAppModal, setCreateEditAppModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        companyname: "",
        status: "",
        Date: "",
        jobtype: "",
        income: "",
        description: ""
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [interviewFormData, setInterviewFormData] = useState({
        applicationid: 1,
        roundnum: 1,
        date: "",
        location: "",
        notes: ""
    });
    const [isInterviewModal, setIsInterviewModal] = useState(false);
    const [interviewToEdit, setInterviewToEdit] = useState(null);

    //Get user info from localStorage
    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    //Misc consts
    const statusOptions = ['Applied', 'Round 1', 'Round 2', 'Round 3', 'Accepted', 'Rejected'];
    const jobTypeOptions = ['Full-time', 'Internship', 'Co-op'];

    //Fetch applications and analytics
    useEffect(() => {
        //Reauth just in case
        if (!token) { navigate("/"); return;}

        //Applications
        axios.get("http://localhost:5000/api/get-applications", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => {
            setApplications(res.data);
        })
        .catch(err => {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate("/");
            }
        });
        
        //Analytics
        axios.get("http://localhost:5000/api/get-analytics", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => {
            setAnalytics(res.data);
            setLoadingAnalytics(false);
        })
        .catch(err => {
            console.error(err);
            setLoadingAnalytics(false);
        });
    }, [token, navigate]);

    //Create/edit application modalhandler
    const handleSubmit = async (e) => {

        //Format income into a number
        const submitData = {
            ...formData,
            income: Number(formData.income),
        };
        e.preventDefault();
        try {
            if (isEditMode) {
                //Update
                const response = await axios.put(
                `http://localhost:5000/api/edit-application/${editingId}`,
                submitData,
                { headers: { Authorization: `Bearer ${token}` } }
                );
                setApplications((prevApplications) => 
                    prevApplications.map((app) => 
                        app.applicationid === editingId ? response.data : app
                    )
                );
                setEditingId(null);
                setIsEditMode(false);
            } else {
                //Create
                const response = await axios.post(
                "http://localhost:5000/api/create-application",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
                );
                setApplications((prevApplications) => [...prevApplications, response.data]);

                //Update analytics
                if (analytics) {
                    const updatedAnalytics = { ...analytics, totalapplied: analytics.totalapplied + 1 };
                    setAnalytics(updatedAnalytics);  //Update frontend
                }
            }
            setFormData({
                name: "",
                companyname: "",
                status: "",
                Date: "",
                jobtype: "",
                income: "",
                description: ""
            });
            setCreateEditAppModal(false);
        } catch (err) {
            console.error(err);
            alert("Error submitting application");
        }
    };

    //Edit modal handler
    const handleEdit = (app) => {
        setFormData({ ...app });
        setEditingId(app.applicationid);
        setIsEditMode(true);
        setCreateEditAppModal(true);
    };

    //Delete application handler
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this application?")) return;
        
        const appIdInt = parseInt(id);
        
        try {
            
            await axios.delete(`http://localhost:5000/api/delete-application/${appIdInt}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications((prevApplications) => prevApplications.filter((app) => app.applicationid !== appIdInt));

            //Update analytics
            if (analytics) {
                const updatedAnalytics = { ...analytics, totalapplied: analytics.totalapplied - 1 };
                setAnalytics(updatedAnalytics);  // Update frontend analytics state
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting application");
        }
    };

    //Create modal form change handler
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    //Modal cancel button handler
    const handleCancel = (e) => {
        setCreateEditAppModal(false);
        setIsEditMode(false);
        setFormData({
            name: "",
            companyname: "",
            status: "",
            Date: "",
            jobtype: "",
            income: "",
            description: ""
        });
        setEditingId(null);
    }

    //Interview visibility toggle
    const toggleInterviews = (applicationId) => {
        setApplications(applications.map((app) => {
            if (app.applicationid === applicationId) {
                // Toggle the visibility of interviews for the specific application
                app.showInterviews = !app.showInterviews;
            }
            return app;
        }));
    };

    //Interview render
    const renderInterviews = (interviews, applicationId) => {
        return (
            <div className="interviews-list">
                <div className="interviews-header">
                    <div>Round</div>
                    <div>Date</div>
                    <div>Location</div>
                    <div>Notes</div>
                    <div>Actions</div>
                    <button className="add-interview-btn" onClick={() => handleAddInterview(applicationId)}>
                        Add Interview
                    </button>
                </div>
                {interviews.map((interview) => (
                    <div key={interview.interviewid} className="interview-row">
                        <div>{interview.roundnum}</div>
                        <div>{interview.Date.split('T')[0]}</div>
                        <div>{interview.Location}</div>
                        <div>{interview.notes}</div>
                        <div className="interview-actions">
                            <button className="edit-btn" onClick={() => handleEditInterview(applicationId, interview)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteInterview(interview.interviewid, applicationId)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    //Submit interview modal handler
    const handleSubmitInterview = (e) => {
        e.preventDefault();

        const interviewData = {
            applicationid: interviewToEdit ? interviewToEdit.applicationid : interviewFormData.applicationid,
            roundnum: interviewFormData.roundnum,
            date: interviewFormData.date,
            location: interviewFormData.location,
            notes: interviewFormData.notes
        };

        if (interviewToEdit) {
            //Edit
            axios.put(`http://localhost:5000/api/edit-interview/${interviewToEdit.interviewid}`, interviewData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setApplications(applications.map(app => {
                    if (app.applicationid === interviewFormData.applicationid) {
                        app.interviews = app.interviews.map(interview => interview.interviewid === res.data.interviewid ? res.data : interview);
                    }
                    return app;
                }));
                setIsInterviewModal(false);
            })
            .catch((err) => {
                console.error(err);
                alert("Error updating interview");
            });
        } else {
            //Add
            axios.post("http://localhost:5000/api/add-interview", interviewData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setApplications(applications.map(app => {
                    if (app.applicationid === interviewData.applicationid) {
                        app.interviews.push(res.data);
                    }
                    return app;
                }));
                setIsInterviewModal(false);
            })
            .catch((err) => {
                console.error(err);
                alert("Error adding interview");
            });
        }
    };
    
    //Adding interview handler
    const handleAddInterview = (applicationId) => {
        setInterviewFormData({
            applicationid: applicationId,
            roundnum: 1,
            date: "",
            location: "",
            notes: ""
        });
        setInterviewToEdit(null);
        setIsInterviewModal(true);
    };

    //Edit interview modal handler
    const handleEditInterview = (applicationId, interview) => {
        setInterviewFormData({
            applicationid: applicationId,
            roundnum: interview.roundnum,
            date: interview.Date,
            location: interview.Location,
            notes: interview.notes
        });
        setInterviewToEdit(interview);
        setIsInterviewModal(true);
    };

    //Interview modal change handler
    const handleInterviewFormChange = (e) => {
        setInterviewFormData({
            ...interviewFormData,
            [e.target.name]: e.target.value
        });
    };

    //Delete interview handler
    const handleDeleteInterview = (interviewId, applicationId) => {

        const interviewIdInt = Number(interviewId);

        axios.delete(`http://localhost:5000/api/delete-interview/${interviewIdInt}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
            setApplications(applications.map(app => {
                if (app.applicationid === applicationId) {
                    app.interviews = app.interviews.filter(interview => interview.interviewid !== interviewId);
                }
                return app;
            }));
        })
        .catch((err) => {
            console.error(err);
            alert("Error deleting interview");
        });
    };

    //Logout handler
    const handleLogout = () => {
        //Remove user info from storage, and auth token to "log out"
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("token");

        //Redirect back to login
        navigate("/");
    };

    //Fill piechart data
    const pieData = analytics ? {
        labels: ['Accepted', 'Rejected', 'First Round', 'Second Round', 'Third Round'],
        datasets: [
            {
                data: [
                    analytics.totalaccepted,
                    analytics.totalrejected,
                    analytics.totalfirstround,
                    analytics.totalsecondround,
                    analytics.totalthirdround,
                ],
                backgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#cb35dc',
                    '#21d7e7',
                    '#ff8419'
                ],
                hoverBackgroundColor: [
                    '#28a745',
                    '#dc3545',
                    '#cb35dc',
                    '#21d7e7',
                    '#ff8419'
                ]
            }
        ]
    } : null;

    if (loadingAnalytics) return <p>Loading analytics...</p>;

    return (
        <div className="home-container">
            <header className="main-header">
                <h1>Dashboard</h1>
                <nav>
                    <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </nav>
            </header>

            <section className="welcome-message">
                <p>Hello, {username}!</p>
            </section>

            <section className="analytics-section">
                <h2>Application Statistics</h2>
                <div className="analytics-content">
                    {/* Conditional rendering for the chart, which fixes the error and pieData issue */}
                    {analytics && pieData && (
                        <>
                            <div className="chart-container" style={{width: "20%"}}>
                                {/* Added options={{ maintainAspectRatio: false }} to fix excessive height/expansion */}
                                <Pie data={pieData} options={{ maintainAspectRatio: false }}/> 
                            </div>
                            <div className="stats-container">
                                <div className="stat-card">
                                    <p><strong>Total Applications:</strong> {applications.length}</p>
                                </div>
                                <div className="stat-card">
                                    <p><strong>Average Income:</strong> $ {analytics.averageincome}</p>
                                </div>
                                <div className="stat-card">
                                    <p><strong>Last Updated:</strong> {analytics.lastupdated.split('T')[0]}</p>
                                </div>
                            </div>
                        </>
                    )}
                    {!analytics && <p className="loading-message">No analytics data available.</p>}
                </div>
            </section>

            <hr />

            <section className="applications-section">
                <h2>Your Applications</h2>
                <button className="create-app-btn" onClick={() => setCreateEditAppModal(true)}>+ Create New Application</button>
                
                {/*Create/edit application modal*/}
                {isCreateEditAppModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>{isEditMode ? "Edit Application" : "Create Application"}</h3>
                            <form className="app-form" onSubmit={handleSubmit}>
                                <input name="name" placeholder="Job Title" value={formData.name} onChange={handleChange} required />
                                <input name="companyname" placeholder="Company Name" value={formData.companyname} onChange={handleChange} required />
                                <select name="status" value={formData.status} onChange={handleChange} required><option value="" disabled>Select Status</option>{statusOptions.map((status) => (<option key={status} value={status}>{status}</option>))}</select>
                                <input name="Date" type="date" placeholder="Application Date" value={formData.Date} onChange={handleChange} required />
                                <select name="jobtype" value={formData.jobtype} onChange={handleChange} required><option value="" disabled>Select Job Type</option>{jobTypeOptions.map((jobType) => (<option key={jobType} value={jobType}>{jobType}</option>))}</select>
                                <input name="income" placeholder="Income" type="number" value={formData.income} onChange={handleChange} required />
                                <textarea name="description" placeholder="Description / Notes" value={formData.description} onChange={handleChange} />

                                <div className="modal-actions">
                                    <button className="primary-btn" type="submit">{isEditMode ? "Update Application" : "Create Application"}</button>
                                    <button className="secondary-btn" type="button" onClick={() => handleCancel()}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/*End create/edit modal*/}
                
                {applications.length === 0 ? (<p className="no-applications">No applications found. Click 'Create New Application' to get started!</p>) : (
                    <div className="app-list">
                        {/* Header Row */}
                        <div className="app-row header">
                            <div className="app-field title-field">Job Title</div>
                            <div className="app-field company-field">Company</div>
                            <div className="app-field status-field">Status</div>
                            <div className="app-field date-field">Date</div>
                            <div className="app-field jobtype-field">Job Type</div>
                            <div className="app-field income-field">Income</div>
                            <div className="app-field description-field">Description</div>
                            <div className="app-actions">Actions</div>
                        </div>
                        {applications.map((app) => (
                            <div key={app.applicationid} className="app-item-wrapper">
                                <div key={app.applicationid} className="app-row data-row"> 
                                    <div className="app-field title-field">{app.name}</div>
                                    <div className="app-field company-field">{app.companyname}</div>
                                    <div className={`app-field status-field status-${app.status.toLowerCase().replace(/ /g, '-')}`}>{app.status}</div>
                                    <div className="app-field date-field">{app.Date.split('T')[0]}</div>
                                    <div className="app-field jobtype-field">{app.jobtype}</div>
                                    <div className="app-field income-field">${app.income}</div>
                                    <div className="app-field description-field">{app.description}</div>
                                    <div className="app-actions">
                                        <button className="edit-btn" onClick={() => handleEdit(app)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDelete(app.applicationid)}>Delete</button>
                                        {app.interviews && (
                                            <button 
                                                className={`toggle-interviews-btn ${app.showInterviews ? 'active' : ''}`}
                                                onClick={() => toggleInterviews(app.applicationid)}
                                            >
                                                {app.showInterviews ? "Hide Interviews" : `Interviews (${app.interviews.length})`}
                                            </button>
                                        )}
                                        {/* Added button for applications with no interviews to allow adding */}
                                        {(!app.interviews || app.interviews.length === 0) && (
                                            <button 
                                                className="toggle-interviews-btn"
                                                onClick={() => handleAddInterview(app.applicationid)}
                                            >
                                                Add Interview
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {app.showInterviews && app.interviews && app.interviews.length > 0 && (
                                    <div className="interviews-row-container">
                                        {renderInterviews(app.interviews, app.applicationid)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/*Interview modal*/}
            {isInterviewModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{interviewToEdit ? "Edit Interview" : "Add Interview"}</h3>
                        <form className="interview-form" onSubmit={handleSubmitInterview}>
                            <div className="form-group">
                                <label htmlFor="roundnum">Round:</label>
                                <input
                                    id="roundnum"
                                    type="number"
                                    name="roundnum"
                                    value={interviewFormData.roundnum}
                                    onChange={handleInterviewFormChange}
                                    min="1"
                                    max="3"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="date">Date:</label>
                                <input
                                    id="date"
                                    type="date"
                                    name="date"
                                    value={interviewFormData.date.split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="location">Location:</label>
                                <select
                                    id="location"
                                    name="location"
                                    value={interviewFormData.location}
                                    onChange={handleInterviewFormChange}
                                    required
                                >
                                    <option value="" disabled>Select location</option>
                                    <option value="Virtual">Virtual</option>
                                    <option value="In-Person">In-Person</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="notes">Notes:</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={interviewFormData.notes}
                                    onChange={handleInterviewFormChange}
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="primary-btn" type="submit">{interviewToEdit ? "Update Interview" : "Add Interview"}</button>
                                <button className="secondary-btn" type="button" onClick={() => {
                                    setIsInterviewModal(false);
                                    setInterviewToEdit(null); // Clear editing state on cancel
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/*End interview modal*/}
            
            <footer className="page-footer">
            </footer>
        </div>
    );
}