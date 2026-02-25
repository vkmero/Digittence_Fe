const fetchAPI = async (url, method = 'GET', data = null) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(url, options);
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || 'API Error');
    return resData;
};

const saveAuth = ({ token, facultyId, name, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('facultyId', facultyId);
    localStorage.setItem('name', name);
    localStorage.setItem('email', email);
};

const checkAuth = () => {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }
};

const logout = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};

function goToPage(page) {
    window.location.href = page;
}

async function loginUser(email, password) {
    const data = await fetchAPI('http://localhost:5000/api/auth/login', 'POST', { email, password });
    saveAuth(data);
    window.location.href = 'dashboard.html';
}

async function registerUser(name, email, password) {
    await fetchAPI('http://localhost:5000/api/auth/register', 'POST', { name, email, password });
    alert('Registration successful! Please login.');
    window.location.href = 'login.html';
}

async function loadStudents(classId, tableBodyId) {
    const students = await fetchAPI(`http://localhost:5000/api/students/${classId}`);
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '';
    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.rollNo}</td>
            <td>${s.name}</td>
            <td>
                <button onclick="deleteStudent('${s._id}', '${classId}', '${tableBodyId}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteStudent(id, classId, tableBodyId) {
    if (confirm('Delete this student?')) {
        await fetchAPI(`http://localhost:5000/api/students/${id}`, 'DELETE');
        loadStudents(classId, tableBodyId);
    }
}

async function loadSubjects(classId, tableBodyId) {
    const subjects = await fetchAPI(`http://localhost:5000/api/subjects/${classId}`);
    const tbody = document.getElementById(tableBodyId);
    tbody.innerHTML = '';
    subjects.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.name}</td>`;
        tbody.appendChild(tr);
    });
}

async function submitAttendance(formId) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            const classId = document.getElementById('classId').value;
            const subject = document.getElementById('subject').value;
            const date = document.getElementById('date').value;
            const hours = Number(document.getElementById('hours').value);
            const records = JSON.parse(document.getElementById('records').value);

            await fetchAPI('http://localhost:5000/api/attendance', 'POST', { class: classId, subject, date, hours, records });
            alert('Attendance marked successfully!');
            form.reset();
        } catch(err) {
            alert(err.message);
        }
    });
}

async function generateReport(formId) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            const classId = document.getElementById('classId').value;
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;

            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/report', {
                method: 'POST',
                headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ classId, start, end })
            });

            if (!res.ok) throw new Error('Failed to generate report');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'attendance_report.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch(err) {
            alert(err.message);
        }
    });
}
