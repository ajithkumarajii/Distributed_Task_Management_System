# How to Create a Project and Manage Team Members

## Creating a Project

### Via UI (Easy Way):
1. Click the **📁 Create Project** button in the header
2. Enter the project name (3-100 characters)
3. Add a description (optional, max 500 characters)
4. Click **✓ Create Project**
5. Your new project will be automatically selected

### Via API (Advanced):
```bash
POST /projects
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website"
}
```

---

## Adding Team Members to a Project

### Via API (Currently Required):
You need to make an API call to add members. You can use Postman or curl:

```bash
POST /projects/{projectId}/members
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user_id_here",
  "role": "MEMBER"
}
```

**Available Roles:**
- `MEMBER` - Can view and work on tasks (default)
- `MANAGER` - Can manage team members and tasks
- `ADMIN` - Full project access

### Steps:
1. Get your project ID from the project selector dropdown
2. Get the user ID of the person you want to add (they must have an account)
3. Send the POST request above with their user ID

---

## Creating a Task

### Via UI (Easy Way):
1. Select a project from the dropdown
2. Click **+ Create Task** button
3. Fill in the form:
   - **Project** - Already selected
   - **Title** - What needs to be done (3-200 characters)
   - **Priority** - Low, Medium, or High
   - **Description** - Details (optional, max 1000 characters)
   - **Assign To** - Select a team member (optional)
   - **Due Date** - When it should be completed (optional)
4. Click **✓ Create Task**

---

## User Roles and Permissions

### ADMIN
- Create projects
- Create tasks
- Assign tasks
- Manage all projects
- Add/remove team members

### MANAGER (Per Project)
- Create tasks in their projects
- Assign tasks
- Manage team members
- Change task status

### MEMBER (Per Project)
- View tasks assigned to them
- Update their own tasks' status
- Cannot create tasks or manage members

---

## Quick Reference

| Action | Who Can Do It | How |
|--------|---------------|-----|
| Create Project | ADMIN only | Click "📁 Create Project" button |
| Create Task | ADMIN, MANAGER | Click "+ Create Task" button |
| Assign Member | ADMIN, MANAGER | API call to `/projects/{id}/members` |
| View Tasks | All roles | Select project → see tasks |
| Update Task Status | Assigned user, MANAGER, ADMIN | Click status button on task |
| Delete Task | ADMIN, MANAGER, Task owner | Click delete button on task |

---

## Example API Calls (Using curl)

### 1. Create a Project
```bash
curl -X POST http://localhost:5000/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App",
    "description": "Build new mobile app"
  }'
```

### 2. Create a Task
```bash
curl -X POST http://localhost:5000/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design login screen",
    "description": "Create beautiful login UI",
    "priority": "High",
    "dueDate": "2026-02-15"
  }'
```

### 3. Add Team Member to Project
```bash
curl -X POST http://localhost:5000/projects/PROJECT_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "role": "MEMBER"
  }'
```

### 4. Get All Projects
```bash
curl -X GET http://localhost:5000/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Project Members
```bash
curl -X GET http://localhost:5000/projects/PROJECT_ID/members \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Project creation button doesn't appear
- Make sure you're logged in as an ADMIN user
- Refresh the page (Ctrl+F5)

### Can't create tasks
- Select a project first from the dropdown
- Make sure you have ADMIN or MANAGER role in that project

### Can't see project members
- They must be added to the project first via API
- You need ADMIN or MANAGER role

### Task not appearing after creation
- Refresh the page
- Check if it's in the correct status (TODO/IN_PROGRESS/DONE)

---

## Postman Collection

You can import the `DTMS-API-Collection.postman_collection.json` file into Postman for easy API testing.
