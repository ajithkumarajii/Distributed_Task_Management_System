# 👥 How to Assign Tasks and Manage Team Members

## 📋 Understanding the Assignment Flow

There are 3 steps to assigning tasks to team members:

1. **Create a Project** ✅ (You do this via UI)
2. **Add Team Members to Project** (Via API - detailed below)
3. **Assign Tasks** ✅ (You do this via UI once team members are added)

---

## 🔄 Step-by-Step: Complete Workflow

### **Step 1: Create a Project**
1. Click **"📁 Create Project"** button
2. Enter project name and description
3. Click **"✓ Create Project"**
4. Your project is ready! You are the **owner**

### **Step 2: Add Team Members to Your Project**
*Currently requires API call (UI coming soon)*

You need to:
1. Get the user ID of the person you want to add
2. Make an API call to add them to the project

#### **Option A: Using Postman**
1. Open Postman
2. Create a new **POST** request
3. URL: `http://localhost:5000/projects/{projectId}/members`
4. Headers:
   - `Authorization`: `Bearer {your_token}`
   - `Content-Type`: `application/json`
5. Body (raw JSON):
```json
{
  "userId": "USER_ID_HERE",
  "role": "MEMBER"
}
```
6. Click **Send**

#### **Option B: Using cURL**
```bash
curl -X POST http://localhost:5000/projects/{projectId}/members \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "role": "MEMBER"
  }'
```

#### **Option C: Using Browser Console**
```javascript
fetch('http://localhost:5000/projects/{projectId}/members', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'USER_ID_HERE',
    role: 'MEMBER'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

### **Step 3: Assign Tasks**
1. Click **"+ Create Task"** button
2. Select your project
3. In the **"👤 Assign To"** dropdown, select a team member
4. Fill other details and click **"✓ Create Task"**
5. Task is now assigned! ✅

---

## 👥 User IDs - How to Find Them

### **Get Your Own User ID**
```javascript
// In browser console, after logging in:
const token = localStorage.getItem('token');
console.log(token); // Your JWT token contains your user ID

// OR make API call:
fetch('http://localhost:5000/auth/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d.user._id)) // Your user ID
```

### **Find Other User's ID**
*They need to give you their user ID, OR:*
1. Have them run the above code in their browser console
2. They share their `_id` value with you
3. Use that ID in the add member API call

---

## 🔐 Roles Explained

When adding team members, you specify a role:

| Role | Permissions |
|------|------------|
| `MEMBER` | Can view tasks assigned to them, update their task status |
| `MANAGER` | Can create tasks, manage team members, update any task |
| `ADMIN` | Full control over all projects (system-wide admin) |

*Note: `ADMIN` is a global role, the others are per-project*

### **Which role to use?**
- **MEMBER**: Team members who work on tasks (most common)
- **MANAGER**: Team leads who oversee the project
- **ADMIN**: Project owner or administrator

---

## 📝 Complete Example Flow

### **Scenario: You and John are working on "Website Redesign" project**

#### **1. You Create the Project**
```
Click: 📁 Create Project
Name: Website Redesign
Description: Complete redesign of company website
Click: ✓ Create Project
```

#### **2. You Get John's User ID**
```
Ask John to run in browser console:
fetch('http://localhost:5000/auth/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(d => console.log(d.user._id))

John shares his ID: 65a1234567890abcdef12345
```

#### **3. You Add John to the Project**
```
Method: POST
URL: http://localhost:5000/projects/697b495db1e23edf9935df19/members
Headers:
  Authorization: Bearer {your_token}
  Content-Type: application/json

Body:
{
  "userId": "65a1234567890abcdef12345",
  "role": "MEMBER"
}

Response:
{
  "success": true,
  "message": "Member added successfully"
}
```

#### **4. You Create a Task**
```
Click: + Create Task
Project: Website Redesign (auto-selected)
Title: Design homepage mockup
Priority: High
Assign To: John (NOW AVAILABLE IN DROPDOWN!)
Due Date: 2026-02-15
Click: ✓ Create Task
```

#### **5. Task Assigned!**
✅ John can now:
- See the task in his task list
- Update task status (TODO → IN_PROGRESS → DONE)
- Add comments (when feature is built)

---

## 🔧 Troubleshooting

### **"No team members" in Assign To dropdown**
**Cause**: You haven't added any team members to the project yet
**Solution**: Add team members using the API call above

### **"Member added" but still not showing in dropdown**
**Cause**: Browser cache or page not refreshed
**Solution**: 
1. Refresh the page (Ctrl+F5)
2. Click "+ Create Task" again
3. Dropdown should show the team member

### **Getting "User not found" error**
**Cause**: User ID is incorrect or that user doesn't exist
**Solution**: 
1. Double-check the user ID spelling
2. Make sure the user has created an account
3. Have them give you their ID directly

### **Cannot create task after adding member**
**Cause**: API call failed silently
**Solution**:
1. Check browser console for errors (F12)
2. Verify user ID format is correct
3. Verify token is still valid (refresh page)

---

## 📱 API Endpoints Reference

### **Add Member to Project**
```
POST /projects/{projectId}/members
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "userId": "string",
  "role": "MEMBER" | "MANAGER"
}

Response:
{
  "success": true,
  "message": "Member added successfully",
  "data": { ... }
}
```

### **Get Project Members**
```
GET /projects/{projectId}/members
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    { "_id": "...", "name": "John", "email": "john@example.com", "role": "MEMBER" },
    { "_id": "...", "name": "Jane", "email": "jane@example.com", "role": "MANAGER" }
  ]
}
```

### **Get Current User Info**
```
GET /auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "_id": "65a1234567890abcdef12345",
    "name": "Your Name",
    "email": "you@example.com",
    "role": "ADMIN"
  }
}
```

---

## 🎯 Quick Reference Card

```
1. Create Project → 📁 Click "Create Project"
2. Get User IDs → Run code in browser console
3. Add Members → POST /projects/{id}/members (API)
4. Create Tasks → ➕ Click "Create Task" → Assign dropdown updated!
5. Manage Tasks → Click status buttons to move through workflow
```

---

## ⚡ Pro Tips

1. **Create multiple projects** for different teams
2. **Assign different roles** to different team members
3. **Use MANAGER role** for team leads
4. **Remove members** if someone leaves (future feature)
5. **Check logs** if assignments don't work (browser console F12)

---

## 🚀 Coming Soon

- ✨ Add/remove team members via UI
- ✨ Change member roles via UI
- ✨ View all members in project
- ✨ Team collaboration features
- ✨ Task comments and mentions

---

**Questions?** Check the browser console (F12) for detailed error messages!
