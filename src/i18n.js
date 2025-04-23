import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      settings: {
        title: 'Settings',
        appearance: 'Appearance',
        darkMode: 'Dark Mode',
        darkModeDesc: 'Switch between light and dark theme',
        notifications: 'Notifications',
        emailNotifications: 'Email Notifications',
        emailDesc: 'Receive updates via email',
        appNotifications: 'In-App Notifications',
        appDesc: 'Receive notifications within the app',
        language: 'Language',
        selectedLanguage: 'Selected Language',
        selectLanguage: 'Select Language',
      },
      account: {
        heading: 'Account',
        profile: 'Profile',
        notifications: 'Notifications',
        settings: 'Settings',
        logout: 'Logout',
        logoutAlertTitle: 'Logout',
        logoutAlertMessage: 'Are you sure you want to logout?',
        cancel: 'Cancel',
      },
      charts: {
        statusDistribution: 'Status Distribution',
        priorityDistribution: 'Priority Distribution',
        monthlyTaskCompletion: 'Monthly Task Completion',
        allTasksAnalytics: 'All Tasks Analytics',
        teamTasksAnalytics: 'Team Tasks Analytics',
        myTasksAnalytics: 'My Tasks Analytics',
        legend: {
          completed: 'Completed',
          pending: 'Pending',
          overdue: 'Overdue',
          high: 'High',
          medium: 'Medium',
          low: 'Low',
          total: 'Total',
        },
      },
      taskcards: {
        pendingTasks: 'Pending Tasks',
        addNewTask: "Add New Task",
        pleaseEnterTaskTitle: "Please enter a task title",
        pleaseEnterTaskDescription: "Please enter a task description",
        invalidDate: "Please enter a valid date in MM/DD/YYYY format",
        unableToDetermineUser: "Unable to determine your user ID. Please log out and log in again.",
        failedToGetUserData: "Failed to get user data. Please try again.",
        failedToAddTask: "Failed to add task. Please try again.",
        titleLabel: "Title *",
        descriptionLabel: "Description *",
        priorityLabel: "Priority:",
        dueDateLabel: "Due Date (MM/DD/YYYY):",
        cancel: "Cancel",
        addTask: "Add Task",
        totaltask: "Total Tasks",
        duetoday: "Due Today",
        completed: "Completed",
        overdue: "Overdue",
        inprogress: "In Progress"
      },
      sortFilter: {
        searchPlaceholder: "Search by title...",
        sort: "Sort",
        sortBy: "Sort By",
        order: "Order",
        sortField: {
          status: "Status",
          priority: "Priority"
        },
        sortOrder: {
          asc: "Ascending",
          desc: "Descending"
        },
        filter: "Filter",
        filterStatusTitle: "Status",
        filterPriorityTitle: "Priority",
        filterStatus: {
          all: "All",
          toDo: "To Do",
          inProgress: "In Progress",
          completed: "Completed",
          overdue: "Overdue"
        },
        filterPriority: {
          all: "All",
          low: "Low",
          medium: "Medium",
          high: "High"
        }
      },
      taskTable: {
        addNewTask: "Add New Task",
        errorFetch: "Failed to load tasks. Please try again.",
        statusUpdated: "Task marked as {{status}}",
        failedStatusUpdate: "Failed to update task status",
        taskUpdated: "Task updated successfully",
        failedUpdate: "Failed to update task",
        taskDeleted: "Task deleted successfully",
        failedDelete: "Failed to delete task. You may not have permission.",
        pleaseEnterTitle: "Please enter a task title",
        taskAdded: "Task added successfully",
        failedAdd: "Failed to add task",
        loading: "Loading tasks...",
        noTasks: "No tasks found",
        header: {
          title: "Title",
          status: "Status",
          priority: "Priority",
          done: "Done"
        },
        dialog: {
          detailsTitle: "Task Details",
          title: "Title",
          description: "Description",
          status: "Status",
          priority: "Priority",
          dueDate: "Due Date",
          noDescription: "No description provided",
          noDueDate: "No due date",
          delete: "Delete",
          deleteTitle: "Delete Task",
          deleteMessage: "Are you sure you want to delete \"{{title}}\"?",
          cancel: "Cancel",
          edit: "Edit",
          close: "Close",
          editTitle: "Edit Task",
          save: "Save",
          addTitle: "Add New Task",
          addTask: "Add Task",
          dismiss: "Dismiss"
        },
        input: {
          title: "Title *",
          description: "Description",
          priority: "Priority",
          dueDate: "Due Date (MM/DD/YYYY)",
          select: "Select"
        }
      },
      kanban: {
        boardTitle: "Kanban Board",
        tasksOverview: "Tasks Overview",
        status: {
          toDo: "To Do",
          inProgress: "In Progress",
          completed: "Completed"
        }
      },
      taskCard: {
       
        noDueDate: "No due date",
        normal: "Normal",
        unknown: "Unknown",
        due: "Due",
        created: "Created",
        moveTo: "Move to:"
      },
      statusPage: {
        noTasks: "No tasks in this status"
      },
      tasksProvider: {
        error: "Error",
        failedLoadUser: "Failed to load user information",
        ok: "OK",
        sessionExpired: "Session Expired",
        loginAgain: "Please login again to continue",
        failedLoadTasks: "Failed to load tasks. Please try again.",
        failedStatusUpdate: "Failed to update task status"
      },
      user: {
        "allTasks": "All Tasks",
        "completed": "Completed",
        "toDo": "To Do",
        "inProgress": "In Progress",
        "tasks": "Tasks",
        "myTasks": "My Tasks",
        "failedToLoadUser": "Failed to load user information",
        "failedToLoadTasks": "Failed to load tasks",
        "noTasksFound": "No tasks found",
        "noDate": "No date",
        "invalidDate": "Invalid date",
        "noPriority": "No priority"
      },
      manager: {
        "noDueDate": "No due date",
        "dropHint": "Drop on member to assign",
        "normalPriority": "Normal",
        "teamMembers": "Team Member",
        "tasksToAssign": "Tasks to Assign",
        "noTasksAvailable": "No tasks available to assign",
        "taskAssigned": "Task Assigned",
        "taskAssignedMsg": "Manager has assigned you a new task \"{{title}}\" ",
        "assignmentFailed": "Assignment Failed",
        "assignmentFailedMsg": "There was a problem assigning the task. Please try again.",
        "noMemberSelected": "No Member Selected",
        "dropTaskHint": "Drop the task directly on a team member card to assign it.",
        "defaultTeamMember": "Team Member",
        "assignmentSuccess": "Task Assigned Successfully",
        "assignmentSuccessMsg": "The task has been assigned to {{memberName}} successfully."

      },
      notifications: {
        "title": "Notifications",
        "noNotifications": "No notifications yet",
        "deleteTitle": "Delete Notification",
        "deleteMessage": "Are you sure you want to delete this notification?"
      },
      "common": {
        "cancel": "Cancel",
        "delete": "Delete",
        save: 'Save',
        error: 'Error',
        success: 'Success',
        
      },
      profile: {
        "profile": "Profile",
        "loadingProfile": "Loading profile data...",
        "retry": "Retry",
        "errorLoadUserData": "Failed to load user data",
        "errorLoadUserDetails": "Failed to load user details",
        "errorUserIdNotFound": "User ID not found",
        "errorLoadingProfile": "Error loading profile data",
        "errorLoadTasks": "Failed to load tasks",
        "errorLoadUserList": "Failed to load user list",
        "errorLoadTeams": "Failed to load teams",
        userDetails: 'User Details',
        editProfile: 'Edit Profile',
        name: 'Name',
        email: 'Email',
        role: 'Role',
        requiredFields: 'Please fill all required fields!',
        profileUpdated: 'Profile updated successfully!',
        profilePictureUpdated: 'Profile picture updated successfully!',
      },
      userStats: {
        taskStatistics: 'Task Statistics',
        totalTasks: 'Total Tasks',
        completed: 'Completed',
        pending: 'Pending',
        avgUpdateTime: 'Avg. Update Time',
      },
      userManagement: {
        title: 'Users',
        addNewUser: 'Add New User',
        createUser: 'Create User',
        editUser: 'Edit User',
        deleteUser: 'Delete User',
        fullName: 'Full Name',
        email: 'Email',
        password: 'Password',
        newPassword: 'New Password (Leave empty to keep current)',
        role: 'Role',
        noUsersFound: 'No users found',
        pageInfo: 'Page {{current}} of {{total}}',
        prev: 'Previous',
        next: 'Next',
        roles: {
          admin: 'Admin',
          manager: 'Manager',
          user: 'User'
        },
        confirmDeleteTitle: 'Confirm Delete',
        confirmDeleteMessage: 'Are you sure you want to delete this user?',
        delete: 'Delete',
        edit: 'Edit',
        userDeleted: 'User deleted successfully!',
        userCreated: 'User created successfully!',
        userUpdated: 'User updated successfully!',
        fillRequiredFields: 'Please fill all required fields',
        emailExists: 'Email already exists. Please use a different email.',
        failedCreate: 'Failed to create user. Please try again.',
        failedUpdate: 'Failed to update user. Please try again.',
        failedDelete: 'Failed to delete user. Please try again.',
        edit: 'Edit',
        delete: 'Delete',
        updateUser: 'Update User',
        addNew: 'Add New',
        usersTotal: 'users',
      },
      teamManagement: {
        yourTeams: 'Your Teams',
        createTeam: 'Create Team',
        createNewTeam: 'Create New Team',
        teamName: 'Team Name',
        selectMembers: 'Select Members',
        members: 'Members',
        team: 'Team',
        currentMembers: 'Current Members',
        availableMembers: 'Available Members',
        memberCount: 'Member Count',
        noTeams: 'You have no teams yet',
        noMembersInTeam: 'No members in this team',
        noAvailableUsers: 'No available users',
        teamNameRequired: 'Team name is required',
        teamCreated: 'Team created successfully',
        memberAdded: 'Member added successfully',
        memberRemoved: 'Member removed successfully',
        errorCreatingTeam: 'Error creating team',
        errorAddingMember: 'Error adding member',
        errorRemovingMember: 'Error removing member',
        errorFetchingUsers: 'Error fetching users',
        alreadyInTeam: 'Already in team',
      },
      admin: {
        "adminDashboard": "Admin Dashboard",
        "viewTasks": "View Tasks",
        "addTeam": "Add Team",
        "loadingTeams": "Loading teams...",
        "noTeams": "No teams available",
        "accessDeniedTitle": "Access Denied",
        "accessDeniedMsg": "You do not have admin privileges.",
        "authErrorTitle": "Authentication Error",
        "authErrorMsg": "Failed to verify user credentials.",
        "dataErrorTitle": "Data Error",
        "loadTeamsError": "Failed to load teams.",
        "loadUsersError": "Failed to load users.",
        "deleteTeamTitle": "Delete Team",
        "deleteTeamConfirm": "Are you sure you want to delete \"{{teamName}}\"?",
        "successTitle": "Success",
        "deleteTeamSuccess": "Team \"{{teamName}}\" deleted successfully.",
        "errorTitle": "Error",
        "deleteTeamFail": "Failed to delete team.",
        "validationErrorTitle": "Validation Error",
        "teamNameRequired": "Team name is required.",
        "managerRequired": "Please select a manager.",
        "teamUpdateSuccess": "Team updated successfully.",
        "teamCreateSuccess": "Team created successfully.",
        "saveTeamFail": "Failed to save team. Please check the logs for details.",
        "noDueDate": "No due date",
        "noDescription": "No description provided",
        "assignToTeam": "Assign to Team",
        "manager": "Manager",
        "members": "Members",
        "noEmail": "No email provided",
        "noMembers": "No members in this team",
        "editTeam": "Edit Team",
        "deleteTeam": "Delete Team",
        "membersCount": "{{count}} members",
        "editTeam": "Edit Team",
        "createTeam": "Create Team",
        "teamNamePlaceholder": "Team Name",
        "selectManager": "Select Manager",
        "selectMembers": "Select Members",
        "noManagersAvailable": "No managers available",
        "noMembersAvailable": "No members available",
        "cancel": "Cancel",
        "create": "Create",
        "update": "Update"
      }


    }
  },
  hi: {
    translation: {
      settings: {
        title: 'सेटिंग्स',
        appearance: 'दिखावट',
        darkMode: 'डार्क मोड',
        darkModeDesc: 'लाइट और डार्क थीम के बीच स्विच करें',
        notifications: 'सूचनाएं',
        emailNotifications: 'ईमेल सूचनाएं',
        emailDesc: 'ईमेल के माध्यम से अद्यतन प्राप्त करें',
        appNotifications: 'ऐप में सूचनाएं',
        appDesc: 'ऐप के अंदर सूचनाएं प्राप्त करें',
        language: 'भाषा',
        selectedLanguage: 'चुनी गई भाषा',
        selectLanguage: 'भाषा का चयन करें',
      },
      account: {
        heading: 'खाता',
        profile: 'प्रोफ़ाइल',
        notifications: 'सूचनाएं',
        settings: 'सेटिंग्स',
        logout: 'लॉगआउट',
        logoutAlertTitle: 'लॉगआउट',
        logoutAlertMessage: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
        cancel: 'रद्द करें',
      },
      charts: {
        statusDistribution: 'स्थिति वितरण',
        priorityDistribution: 'प्राथमिकता वितरण',
        monthlyTaskCompletion: 'मासिक कार्य पूर्णता',
        allTasksAnalytics: 'सभी कार्यों का विश्लेषण',
        teamTasksAnalytics: 'टीम के कार्यों का विश्लेषण',
        myTasksAnalytics: 'मेरे कार्यों का विश्लेषण',
        legend: {
          completed: 'पूर्ण',
          pending: 'अनुरोध पर',
          overdue: 'देरी',
          high: 'उच्च',
          medium: 'मध्यम',
          low: 'निम्न',
          total: 'कुल',
        },
      },
      taskcards: {
        pendingTasks: 'लंबित कार्य',
        addNewTask: "नई कार्य जोड़ें",
        pleaseEnterTaskTitle: "कृपया कार्य का शीर्षक दर्ज करें",
        pleaseEnterTaskDescription: "कृपया कार्य का विवरण दर्ज करें",
        invalidDate: "कृपया MM/DD/YYYY प्रारूप में एक वैध तिथि दर्ज करें",
        unableToDetermineUser: "आपका उपयोगकर्ता आईडी निर्धारित करने में असमर्थ। कृपया लॉग आउट करें और फिर से लॉग इन करें।",
        failedToGetUserData: "उपयोगकर्ता डेटा प्राप्त करने में विफल। कृपया पुनः प्रयास करें।",
        failedToAddTask: "कार्य जोड़ने में विफल। कृपया पुनः प्रयास करें।",
        titleLabel: "शीर्षक *",
        descriptionLabel: "विवरण *",
        priorityLabel: "प्राथमिकता:",
        dueDateLabel: "नियत तिथि (MM/DD/YYYY):",
        cancel: "रद्द करें",
        addTask: "कार्य जोड़ें",
        totaltask: "कुल कार्य",
        duetoday: "आज की नियत तिथि",
        completed: "पूर्ण",
        overdue: "देरी",
        inprogress: "प्रगति पर"
      },
      sortFilter: {
        searchPlaceholder: "शीर्षक से खोजें...",
        sort: "सॉर्ट",
        sortBy: "सॉर्ट बाय",
        order: "क्रम",
        sortField: {
          status: "स्थिति",
          priority: "प्राथमिकता"
        },
        sortOrder: {
          asc: "आरोही",
          desc: "अवरोही"
        },
        filter: "फिल्टर",
        filterStatusTitle: "स्थिति",
        filterPriorityTitle: "प्राथमिकता",
        filterStatus: {
          all: "सभी",
          toDo: "करना है",
          inProgress: "प्रगति पर",
          completed: "पूरा",
          overdue: "देर"
        },
        filterPriority: {
          all: "सभी",
          low: "निम्न",
          medium: "मध्यम",
          high: "उच्च"
        }
      },
      taskTable: {
        addNewTask: "नई कार्य जोड़ें",
        errorFetch: "कार्य लोड करने में विफल। कृपया पुनः प्रयास करें।",
        statusUpdated: "कार्य को {{status}} के रूप में चिह्नित किया गया",
        failedStatusUpdate: "कार्य स्थिति अपडेट करने में विफल",
        taskUpdated: "कार्य सफलतापूर्वक अपडेट हुआ",
        failedUpdate: "कार्य अपडेट करने में विफल",
        taskDeleted: "कार्य सफलतापूर्वक हटाया गया",
        failedDelete: "कार्य हटाने में विफल। आपके पास अनुमति नहीं हो सकती है।",
        pleaseEnterTitle: "कृपया कार्य का शीर्षक दर्ज करें",
        taskAdded: "कार्य सफलतापूर्वक जोड़ा गया",
        failedAdd: "कार्य जोड़ने में विफल",
        loading: "कार्य लोड हो रहे हैं...",
        noTasks: "कोई कार्य नहीं मिला",
        header: {
          title: "शीर्षक",
          status: "स्थिति",
          priority: "प्राथमिकता",
          done: "समाप्त"
        },
        dialog: {
          detailsTitle: "कार्य विवरण",
          title: "शीर्षक",
          description: "विवरण",
          status: "स्थिति",
          priority: "प्राथमिकता",
          dueDate: "नियत तिथि",
          noDescription: "कोई विवरण नहीं दिया गया",
          noDueDate: "कोई नियत तिथि नहीं",
          delete: "कार्य हटाएँ",
          deleteTitle: "कार्य हटाएँ",
          deleteMessage: "क्या आप वाकई \"{{title}}\" को हटाना चाहते हैं?",
          cancel: "रद्द करें",
          edit: "संपादित करें",
          close: "बंद करें",
          editTitle: "कार्य संपादित करें",
          save: "सहेजें",
          addTitle: "नई कार्य जोड़ें",
          addTask: "कार्य जोड़ें",
          dismiss: "बंद करें"
        },
        input: {
          title: "शीर्षक *",
          description: "विवरण",
          priority: "प्राथमिकता",
          dueDate: "नियत तिथि (MM/DD/YYYY)",
          select: "चुनें"
        }
      },
      kanban: {
        boardTitle: "कानबन बोर्ड",
        tasksOverview: "कार्य अवलोकन",
        status: {
          toDo: "करना है",
          inProgress: "प्रगति में",
          completed: "पूरा हुआ"
        }
      },
      taskCard: {
       
        noDueDate: "कोई नियत तिथि नहीं",
        normal: "सामान्य",
        unknown: "अज्ञात",
        due: "नियत तिथि",
        created: "बनाया गया",
        moveTo: "स्थानांतरित करें:"
      },
      statusPage: {
        noTasks: "इस स्थिति में कोई कार्य नहीं"
      },
      tasksProvider: {
        error: "त्रुटि",
        failedLoadUser: "उपयोगकर्ता जानकारी लोड करने में विफल",
        ok: "ठीक है",
        sessionExpired: "सत्र समाप्त हो गया",
        loginAgain: "जारी रखने के लिए कृपया फिर से लॉगिन करें",
        failedLoadTasks: "कार्य लोड करने में विफल। कृपया पुनः प्रयास करें।",
        failedStatusUpdate: "कार्य की स्थिति अपडेट करने में विफल"
      },
      user: {
        allTasks: "सभी कार्य",
        completed: "पूर्ण",
        toDo: "करना है",
        inProgress: "प्रगति पर",
        tasks: "कार्य",
        myTasks: "मेरे कार्य",
        failedToLoadUser: "उपयोगकर्ता जानकारी लोड करने में विफल",
        failedToLoadTasks: "कार्य लोड करने में विफल",
        noTasksFound: "कोई कार्य नहीं मिला",
        noDate: "कोई तिथि नहीं",
        invalidDate: "अमान्य तिथि",
        noPriority: "कोई प्राथमिकता नहीं"
      },
      manager: {
        noDueDate: "कोई नियत तिथि नहीं",
        dropHint: "सदस्य पर ड्रॉप करें ताकि असाइन किया जा सके",
        normalPriority: "सामान्य",
        teamMembers: "टीम सदस्य",
        tasksToAssign: "असाइन करने के लिए कार्य",
        noTasksAvailable: "असाइन करने के लिए कोई कार्य उपलब्ध नहीं है",
        taskAssigned: "कार्य असाइन किया गया",
        taskAssignedMsg: "कार्य \"{{title}}\" को {{memberName}} को असाइन किया गया है",
        assignmentFailed: "असाइनमेंट विफल",
        assignmentFailedMsg: "कार्य असाइन करने में समस्या हुई। कृपया पुनः प्रयास करें।",
        noMemberSelected: "कोई सदस्य चयनित नहीं",
        dropTaskHint: "कार्य को सीधे किसी टीम सदस्य कार्ड पर ड्रॉप करें ताकि असाइन किया जा सके।",
        defaultTeamMember: "टीम सदस्य",
        assignmentSuccess: "कार्य सफलतापूर्वक सौंपा गया",
        assignmentSuccessMsg: "{{memberName}} को कार्य सफलतापूर्वक सौंपा गया है।"
      },
      notifications: {
        title: "सूचनाएँ",
        noNotifications: "अभी कोई सूचना नहीं है",
        deleteTitle: "सूचना हटाएं",
        deleteMessage: "क्या आप वाकई इस सूचना को हटाना चाहते हैं?"
      },
      common: {
        cancel: "रद्द करें",
        delete: "हटाएं",
        save: 'सहेजें',
        error: 'त्रुटि',
        success: 'सफलता',
      },
      profile: {
        profile: "प्रोफ़ाइल",
        loadingProfile: "प्रोफ़ाइल डेटा लोड हो रहा है...",
        retry: "पुनः प्रयास करें",
        errorLoadUserData: "उपयोगकर्ता डेटा लोड करने में विफल",
        errorLoadUserDetails: "उपयोगकर्ता विवरण लोड करने में विफल",
        errorUserIdNotFound: "उपयोगकर्ता आईडी नहीं मिली",
        errorLoadingProfile: "प्रोफ़ाइल डेटा लोड करने में त्रुटि",
        errorLoadTasks: "कार्य लोड करने में विफल",
        errorLoadUserList: "उपयोगकर्ता सूची लोड करने में विफल",
        errorLoadTeams: "टीमें लोड करने में विफल",
        userDetails: 'उपयोगकर्ता विवरण',
        editProfile: 'प्रोफ़ाइल संपादित करें',

        name: 'नाम',
        email: 'ईमेल',
        role: 'भूमिका',

        requiredFields: 'कृपया सभी आवश्यक फ़ील्ड भरें!',
        profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई!',
        profilePictureUpdated: 'प्रोफ़ाइल चित्र सफलतापूर्वक अपडेट हुआ!',
      },
      userStats: {
        taskStatistics: 'कार्य सांख्यिकी',
        totalTasks: 'कुल कार्य',
        completed: 'पूर्ण',
        pending: 'लंबित',
        avgUpdateTime: 'औसत अद्यतन समय',
      },
      userManagement: {
        title: 'उपयोगकर्ता',
        addNewUser: 'नया उपयोगकर्ता जोड़ें',
        createUser: 'उपयोगकर्ता बनाएँ',
        editUser: 'उपयोगकर्ता संपादित करें',
        deleteUser: 'उपयोगकर्ता हटाएं',
        fullName: 'पूरा नाम',
        email: 'ईमेल',
        password: 'पासवर्ड',
        newPassword: 'नया पासवर्ड (मौजूदा रखने के लिए खाली छोड़ें)',
        role: 'भूमिका',
        noUsersFound: 'कोई उपयोगकर्ता नहीं मिला।',
        pageInfo: 'पृष्ठ {{current}} of {{total}}',
        prev: 'पिछला',
        next: 'अगला',
        roles: {
          admin: 'प्रशासक',
          manager: 'प्रबंधक',
          user: 'उपयोगकर्ता'
        },
        confirmDeleteTitle: 'हटाने की पुष्टि करें',
        confirmDeleteMessage: 'क्या आप वाकई इस उपयोगकर्ता को हटाना चाहते हैं?',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        userDeleted: 'उपयोगकर्ता सफलतापूर्वक हटाया गया!',
        userCreated: 'उपयोगकर्ता सफलतापूर्वक बनाया गया!',
        userUpdated: 'उपयोगकर्ता सफलतापूर्वक अपडेट हुआ!',
        fillRequiredFields: 'कृपया सभी आवश्यक फ़ील्ड भरें',
        emailExists: 'ईमेल पहले से मौजूद है। कृपया अलग ईमेल का उपयोग करें।',
        failedCreate: 'उपयोगकर्ता बनाने में विफल। कृपया पुनः प्रयास करें।',
        failedUpdate: 'उपयोगकर्ता अपडेट करने में विफल। कृपया पुनः प्रयास करें।',
        failedDelete: 'उपयोगकर्ता हटाने में विफल। कृपया पुनः प्रयास करें।',
        edit: 'संपादित करें',
        delete: 'हटाएं',
        updateUser: 'उपयोगकर्ता अपडेट करें',
        addNew: 'नया जोड़ें',
        usersTotal: 'उपयोगकर्ता',
      },
      teamManagement: {
        yourTeams: 'आपकी टीमें',
        createTeam: 'टीम बनाएँ',
        createNewTeam: 'नई टीम बनाएँ',
        teamName: 'टीम का नाम',
        selectMembers: 'सदस्य चुनें',
        members: 'सदस्य',
        team: 'टीम',
        currentMembers: 'वर्तमान सदस्य',
        availableMembers: 'उपलब्ध सदस्य',
        memberCount: 'सदस्य संख्या',
        noTeams: 'आपके पास अभी कोई टीम नहीं है। एक बनाएँ!',
        noMembersInTeam: 'इस टीम में अभी कोई सदस्य नहीं हैं',
        noAvailableUsers: 'जोड़ने के लिए कोई उपलब्ध उपयोगकर्ता नहीं हैं',
        teamNameRequired: 'टीम का नाम आवश्यक है',
        teamCreated: 'टीम सफलतापूर्वक बनाई गई',
        memberAdded: 'सदस्य सफलतापूर्वक जोड़ा गया',
        memberRemoved: 'सदस्य सफलतापूर्वक हटाया गया',
        errorCreatingTeam: 'टीम बनाने में त्रुटि',
        errorAddingMember: 'टीम सदस्य जोड़ने में त्रुटि',
        errorRemovingMember: 'टीम सदस्य हटाने में त्रुटि',
        errorFetchingUsers: 'उपलब्ध उपयोगकर्ताओं को लाने में विफल',
        alreadyInTeam: 'Already in team',
      },
      admin: {
        "adminDashboard": "प्रशासन डैशबोर्ड",
        "viewTasks": "कार्य देखें",
        "addTeam": "टीम जोड़ें",
        "loadingTeams": "टीमें लोड हो रही हैं...",
        "noTeams": "कोई टीमें उपलब्ध नहीं हैं",
        "accessDeniedTitle": "पहुंच अस्वीकृत",
        "accessDeniedMsg": "आपके पास प्रशासक की अनुमतियाँ नहीं हैं।",
        "authErrorTitle": "प्रमाणीकरण त्रुटि",
        "authErrorMsg": "उपयोगकर्ता क्रेडेंशियल सत्यापित करने में विफल।",
        "dataErrorTitle": "डेटा त्रुटि",
        "loadTeamsFailed": "टीमें लोड करने में विफल।",
        "loadUsersFailed": "उपयोगकर्ता लोड करने में विफल।",
        "deleteTeam": "टीम हटाएं",
        "confirmDelete": "क्या आप वाकई \"{{teamName}}\" टीम को हटाना चाहते हैं?",
        "cancel": "रद्द करें",
        "delete": "हटाएं",
        "success": "सफलता",
        "teamDeleted": "टीम \"{{teamName}}\" सफलतापूर्वक हटाई गई।",
        "error": "त्रुटि",
        "deleteFailed": "टीम हटाने में विफल।",
        "validationError": "मान्यता त्रुटि",
        "teamNameRequired": "टीम का नाम आवश्यक है।",
        "selectManager": "कृपया एक प्रबंधक चुनें।",
        "teamUpdated": "टीम सफलतापूर्वक अपडेट की गई।",
        "teamCreated": "टीम सफलतापूर्वक बनाई गई।",
        "teamSaveFailed": "टीम को सेव करने में विफल। कृपया विवरण के लिए लॉग देखें।",
        "manager": "प्रबंधक",
        "members": "सदस्य",
        "noEmail": "कोई ईमेल प्रदान नहीं किया गया",
        "noMembers": "इस टीम में कोई सदस्य नहीं हैं",
        "editTeam": "टीम संपादित करें",
        "deleteTeam": "टीम हटाएं",
        "membersCount": "{{count}} सदस्य",
        "editTeam": "टीम संपादित करें",
        "createTeam": "टीम बनाएं",
        "teamNamePlaceholder": "टीम का नाम",
        "selectManager": "प्रबंधक चुनें",
        "selectMembers": "सदस्य चुनें",
        "noManagersAvailable": "कोई प्रबंधक उपलब्ध नहीं हैं",
        "noMembersAvailable": "कोई सदस्य उपलब्ध नहीं हैं",
        "cancel": "रद्द करें",
        "create": "बनाएं",
        "update": "अपडेट करें"
      },


    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('@language');
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
};

export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('@language', language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export default i18n;
