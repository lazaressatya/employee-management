
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const initialForm = {
  name: "",
  email: "",
  department: "Engineering",
  position: "",
};

export default function Home() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // READ: Fetch employees from MongoDB through the API
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/employees", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load employees");
      }

      setEmployees(data);
    } catch (err) {
      setError(err.message || "Unable to connect to the database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Search employees by name, email, department, or position
  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) =>
      [
        employee.name,
        employee.email,
        employee.department,
        employee.position,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [employees, search]);

  // CREATE and UPDATE
  async function addEmployee(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/employees", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId ? { ...form, id: editingId } : form
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save employee");
      }

      setForm({ ...initialForm });
      setEditingId(null);
      setNotice(result.message || "Employee saved successfully");

      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to save employee");
    } finally {
      setSaving(false);
    }
  }

  // Load employee details into the form for editing
  function editEmployee(employee) {
    setEditingId(employee._id);

    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
    });

    setError("");
    setNotice("");

    document
      .getElementById("add-employee")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // Cancel editing or clear the form
  function cancelEdit() {
    setEditingId(null);
    setForm({ ...initialForm });
    setError("");
    setNotice("");
  }

  // DELETE
  async function deleteEmployee(id) {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete employee");
      }

      if (editingId === id) {
        cancelEdit();
      }

      setNotice(result.message || "Employee deleted successfully");

      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to delete employee");
    } finally {
      setDeletingId(null);
    }
  }

  const departmentCount = new Set(
    employees.map((employee) => employee.department)
  ).size;

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">E</span>
          <span>
            Elevate<span className="brand-light">HR</span>
          </span>
        </a>

        <p className="nav-heading">WORKSPACE</p>

        <a className="nav-link active" href="#dashboard">
          <span>▦</span> Dashboard
        </a>

        <a className="nav-link" href="#employees">
          <span>♙</span> Employees
        </a>

        <a className="nav-link" href="#add-employee">
          <span>＋</span> Add employee
        </a>

        <div className="sidebar-bottom">
          <div className="profile-avatar">HR</div>
          <div>
            <strong>HR Manager</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>

      {/* Main dashboard */}
      <section className="main-area" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Employee dashboard</h1>
            <p className="muted">
              Manage your people, all in one place.
            </p>
          </div>

          <a className="primary-button top-button" href="#add-employee">
            + Add employee
          </a>
        </header>

        {/* Statistics */}
        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon purple">♙</span>
            <p>Total employees</p>
            <h2>{employees.length}</h2>
            <small>Registered employee records</small>
          </article>

          <article className="stat-card">
            <span className="stat-icon green">✓</span>
            <p>Departments</p>
            <h2>{departmentCount}</h2>
            <small>Across your organization</small>
          </article>

          <article className="stat-card">
            <span className="stat-icon orange">✦</span>
            <p>Search results</p>
            <h2>{filteredEmployees.length}</h2>
            <small>Employees matching your search</small>
          </article>
        </div>

        {/* Notifications */}
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="alert success" role="status">
            {notice}
          </div>
        )}

        {/* Employee list */}
        <section className="panel" id="employees">
          <div className="panel-heading">
            <div>
              <h2>All employees</h2>
              <p className="muted">
                View and manage your employee directory.
              </p>
            </div>

            <input
              className="search-input"
              type="search"
              placeholder="Search employees..."
              aria-label="Search employees"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>DEPARTMENT</th>
                  <th>POSITION</th>
                  <th>JOINED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      Loading employees...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      {search
                        ? "No employees match your search."
                        : "No employees found. Add your first employee below."}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee._id}>
                      <td>
                        <div className="employee-cell">
                          <span className="employee-avatar">
                            {employee.name?.charAt(0).toUpperCase() || "E"}
                          </span>

                          <span>
                            <strong>{employee.name}</strong>
                            <small>{employee.email}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="department-tag">
                          {employee.department}
                        </span>
                      </td>

                      <td>{employee.position}</td>

                      <td>
                        {employee.createdAt
                          ? new Date(employee.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => editEmployee(employee)}
                            disabled={deletingId === employee._id}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deleteEmployee(employee._id)}
                            disabled={deletingId === employee._id}
                          >
                            {deletingId === employee._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create / Edit employee form */}
        <section className="panel form-panel" id="add-employee">
          <div className="panel-heading">
            <div>
              <h2>
                {editingId ? "Edit employee" : "Add a new employee"}
              </h2>

              <p className="muted">
                {editingId
                  ? "Update the employee details below."
                  : "Enter the employee details to save them in MongoDB."}
              </p>
            </div>
          </div>

          <form onSubmit={addEmployee}>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <label>
                Email address
                <input
                  required
                  type="email"
                  maxLength={254}
                  placeholder="alex@company.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>

              <label>
                Department
                <select
                  required
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                >
                  <option>Engineering</option>
                  <option>DevOps</option>
                  <option>Human Resources</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>Operations</option>
                </select>
              </label>

              <label>
                Job position
                <input
                  required
                  maxLength={100}
                  placeholder="e.g. Software Engineer"
                  value={form.position}
                  onChange={(event) =>
                    setForm({ ...form, position: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-button" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update employee"
                    : "Save employee"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
                disabled={saving}
              >
                {editingId ? "Cancel edit" : "Clear form"}
              </button>
            </div>
          </form>
        </section>

        <footer className="footer">
          ElevateHR · Next.js + MongoDB Atlas
        </footer>
      </section>
    </main>
  );
}
