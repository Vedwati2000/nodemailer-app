import "./EmailSender.css";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Title
);

// const API_URL = "https://nodemailer-1-4apc.onrender.com";

const API_URL = "http://localhost:4000";

const emailOptions = {
    attendance: {
        label: "Attendance Warning",
        description: "Send a warning about consecutive absences.",
        subject: "Attendance Warning Notice"
    },
    culture: {
        label: "Culture-Related Warning",
        description: "Address a specific concern about student conduct.",
        subject: "Student Conduct and Campus Culture"
    },
    academic: {
        label: "Academic Appreciation",
        description: "Appreciate a student's academic performance.",
        subject: "Congratulations on Your Academic Achievement"
    },
    house: {
        label: "House Winner Appreciation",
        description: "Celebrate a student's house competition achievement.",
        subject: "Congratulations on Your House Achievement"
    }
};

function EmailSender() {
    const [to, setTo] = useState("");
    const [category, setCategory] = useState("attendance");
    const [absentDays, setAbsentDays] = useState(4);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [stats, setStats] = useState({
        totalWarnings: 0,
        totalEmails: 0,
        categoryCounts: {
            attendance: 0,
            culture: 0,
            academic: 0,
            house: 0
        },
        students: []
    });

    async function loadStats() {
        try {
            const response = await fetch(`${API_URL}/attendance/stats`);

            if (!response.ok) {
                throw new Error("Unable to fetch statistics");
            }

            const data = await response.json();

            setStats({
                totalWarnings: data.totalWarnings ?? 0,
                totalEmails: data.totalEmails ?? 0,
                categoryCounts: {
                    attendance: data.categoryCounts?.attendance ?? 0,
                    culture: data.categoryCounts?.culture ?? 0,
                    academic: data.categoryCounts?.academic ?? 0,
                    house: data.categoryCounts?.house ?? 0
                },
                students: data.students ?? []
            });
        } catch (error) {
            console.error("Statistics error:", error.message);
        }
    }

    useEffect(() => {
        loadStats();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();

        if (category === "attendance" && absentDays <= 3) {
            setStatus("attendance-error");
            return;
        }

        setLoading(true);
        setStatus("");

        try {

            const response = await fetch(`${API_URL}/send-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    to,
                    category,
                    absentDays: Number(absentDays)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Backend response:", data);

                throw new Error(
                    data.message || "Unable to generate or send the email"
                );
            }

            setStatus("success");
            setTo("");

            await loadStats();
        } catch (error) {
            console.error("Email error:", error);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    }

    const attendanceChart = {
        labels: stats.students.map(student => student.email),
        datasets: [
            {
                label: "Consecutive Absent Days",
                data: stats.students.map(
                    student => student.absentDays
                ),
                backgroundColor: "#2196F3",
                borderRadius: 6
            }
        ]
    };

    const categoryChart = {
        labels: Object.values(emailOptions).map(option => option.label),
        datasets: [
            {
                label: "Emails Sent",
                data: [
                    stats.categoryCounts.attendance,
                    stats.categoryCounts.culture,
                    stats.categoryCounts.academic,
                    stats.categoryCounts.house
                ],
                backgroundColor: [
                    "#0D47A1",
                    "#2196F3",
                    "#90CAF9",
                    "#64B5F6"
                ],
                borderWidth: 1
            }
        ]
    };

    return (
        <div className="container py-5">

            <div className="mb-5">
                <h1 className="fw-bold">Student Communication Dashboard</h1>
                <p className="text-secondary">
                    Send AI-generated emails and monitor student attendance.
                </p>
            </div>

            <div className="row g-4 mb-5">

                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <p className="text-secondary mb-2">
                                Attendance Warnings Sent
                            </p>
                            <h2 className="fw-bold text-warning">
                                {stats.totalWarnings}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <p className="text-secondary mb-2">
                                Total Emails Sent
                            </p>
                            <h2 className="fw-bold text-primary">
                                {stats.totalEmails}
                            </h2>
                        </div>
                    </div>
                </div>

            </div>

            <div className="row g-4">

                <div className="col-lg-6">

                    <div className="card border-0 shadow rounded-4 h-100">

                        <div className="card-header bg-primary text-white p-4 rounded-top-4">
                            <h3 className="mb-1">Send Student Email</h3>
                            <p className="mb-0">
                                Select a category and send an AI-generated email.
                            </p>
                        </div>

                        <div className="card-body p-4">

                            {status === "success" && (
                                <div className="alert alert-success">
                                    Email sent successfully!
                                </div>
                            )}

                            {status === "error" && (
                                <div className="alert alert-danger">
                                    Failed to send the email. Check your backend
                                    and try again.
                                </div>
                            )}

                            {status === "attendance-error" && (
                                <div className="alert alert-warning">
                                    An attendance warning can only be sent when
                                    consecutive absences exceed 3 days.
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>

                                <div className="mb-4">
                                    <label
                                        htmlFor="to"
                                        className="form-label fw-semibold"
                                    >
                                        Student Email Address
                                    </label>

                                    <input
                                        id="to"
                                        type="email"
                                        className="form-control form-control-lg"
                                        placeholder="student@example.com"
                                        value={to}
                                        onChange={e => setTo(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="category"
                                        className="form-label fw-semibold"
                                    >
                                        Email Category
                                    </label>

                                    <select
                                        id="category"
                                        className="form-select form-select-lg"
                                        value={category}
                                        onChange={e => {
                                            setCategory(e.target.value);
                                            setStatus("");
                                        }}
                                    >
                                        {Object.entries(emailOptions).map(
                                            ([value, option]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {option.label}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <div className="form-text">
                                        {emailOptions[category].description}
                                    </div>
                                </div>

                                {category === "attendance" && (
                                    <div className="mb-4">
                                        <label
                                            htmlFor="absentDays"
                                            className="form-label fw-semibold"
                                        >
                                            Consecutive Absent Days
                                        </label>

                                        <input
                                            id="absentDays"
                                            type="number"
                                            className="form-control form-control-lg"
                                            min="4"
                                            max="365"
                                            value={absentDays}
                                            onChange={e =>
                                                setAbsentDays(e.target.value)
                                            }
                                            required
                                        />

                                        <div className="form-text">
                                            Enter more than 3 consecutive days.
                                        </div>
                                    </div>
                                )}

                                <div className="alert alert-light border">
                                    <strong>Subject:</strong>
                                    <p className="mb-0 mt-1">
                                        {emailOptions[category].subject}
                                    </p>
                                    <small className="text-secondary">
                                        The AI will prepare the email message
                                        based on your selected category.
                                    </small>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-100"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Generating and Sending..."
                                        : "Generate AI Email & Send"}
                                </button>

                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">

                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4">
                            <h4 className="fw-bold mb-4">
                                Consecutive Absence Report
                            </h4>

                            {stats.students.length > 0 ? (
                                <div style={{ height: "300px" }}>
                                    <Bar
                                        data={attendanceChart}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                title: {
                                                    display: true,
                                                    text: "Student Attendance Analysis"
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        precision: 0
                                                    },
                                                    title: {
                                                        display: true,
                                                        text: "Absent Days"
                                                    }
                                                },
                                                x: {
                                                    title: {
                                                        display: true,
                                                        text: "Students"
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className="text-secondary">
                                    No attendance history available yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4">
                            <h4 className="fw-bold mb-4">
                                Email Category Report
                            </h4>

                            {Object.values(stats.categoryCounts).some(count => count > 0) ? (
                                <Doughnut
                                    data={categoryChart}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: true,
                                        plugins: {
                                            legend: {
                                                position: "bottom"
                                            },
                                            title: {
                                                display: true,
                                                text: "Emails Sent by Category"
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-secondary">
                                    No email statistics available yet. Send an email to start tracking.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EmailSender;
