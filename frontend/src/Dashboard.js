import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = ({ user, onLogout }) => {
  const [courses, setCourses] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const url =
        user.role === 'faculty'
          ? `${API_URL}/courses?created_by=${encodeURIComponent(user.email)}`
          : `${API_URL}/courses`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load courses');
      const data = await response.json();
      setCourses(data);
      setError('');
    } catch (err) {
      setError('Could not connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          video_url: newUrl,
          created_by: user.email,
        }),
      });
      if (!response.ok) throw new Error();
      setNewTitle('');
      setNewUrl('');
      await fetchCourses();
    } catch (err) {
      setError('Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const response = await fetch(`${API_URL}/courses/${courseId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      await fetchCourses();
    } catch (err) {
      setError('Could not delete the course.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingCourse.title,
          video_url: editingCourse.video_url,
        }),
      });
      if (!response.ok) throw new Error();
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      setError('Failed to update course.');
    }
  };

  const getEmbedUrl = (url) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand-section">
          <h2>Learning Platform</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span className="role-badge">{user.role}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
        {error && <div className="msg msg-error">{error}</div>}

        {/* Faculty: Add Course */}
        {user.role === 'faculty' && !editingCourse && (
          <section style={{ marginBottom: '40px' }}>
            <h3 className="section-title">Faculty Control Panel</h3>
            <div className="add-course-card">
              <h4 style={{ marginBottom: '20px', color: '#6366f1' }}>Publish New Content</h4>
              <form onSubmit={handleAddCourse} className="input-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Course Title</label>
                  <input type="text" className="custom-input" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>YouTube URL</label>
                  <input type="text" className="custom-input" placeholder="URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: 0, width: 'auto', padding: '12px 30px' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Publish'}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Faculty: Edit Form */}
        {editingCourse && (
          <section style={{ marginBottom: '40px' }}>
            <h3 className="section-title">Editing: {editingCourse.title}</h3>
            <div className="add-course-card" style={{ border: '2px solid #6366f1' }}>
              <form onSubmit={handleUpdate} className="input-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>New Title</label>
                  <input type="text" className="custom-input" value={editingCourse.title} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>New URL</label>
                  <input type="text" className="custom-input" value={editingCourse.video_url} onChange={(e) => setEditingCourse({ ...editingCourse, video_url: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ marginTop: 0, padding: '12px 20px' }}>Save</button>
                  <button type="button" className="logout-btn" style={{ marginLeft: 0 }} onClick={() => setEditingCourse(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Course Grid */}
        <section>
          <h3 className="section-title">{user.role === 'faculty' ? 'My Published Courses' : 'Available Courses'}</h3>

          {loading ? (
            <div className="empty-state">Loading courses...</div>
          ) : courses.length > 0 ? (
            <div className="course-grid">
              {courses.map((course) => (
                <div key={course.id} className="course-card">
                  <div style={{ marginBottom: '15px', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                    <iframe width="100%" height="100%" src={getEmbedUrl(course.video_url)} title={course.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  </div>
                  <h4>{course.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '10px' }}>By: {course.created_by}</p>

                  {user.role === 'faculty' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button className="watch-btn" style={{ flex: 1, cursor: 'pointer', border: 'none', background: '#f5f3ff' }} onClick={() => setEditingCourse(course)}>Edit</button>
                      <button className="watch-btn" style={{ flex: 1, cursor: 'pointer', border: 'none', background: '#fef2f2', color: '#ef4444' }} onClick={() => handleDelete(course.id)}>Delete</button>
                    </div>
                  )}

                  {user.role === 'student' && (
                    <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
                      <span className="watch-btn" style={{ display: 'block', background: '#e0e7ff', color: '#4338ca', textAlign: 'center' }}>▶ Watch Above</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No courses found. {user.role === 'faculty' ? 'Publish your first course above.' : 'Check back soon!'}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;