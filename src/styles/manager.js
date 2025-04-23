export const managerStyles = {
  membersContainer: { 
    marginBottom: 24,
  },
  tasksContainer: { 
    marginBottom: 20,
  },
  tasksGrid: { 
    flex: 1,
  },
  horizontalScrollContent: {
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 8,
  }
};

export const taskStyles = {
  taskWrapper: {
    marginVertical: 6,
  },
  draggedTask: { 
    opacity: 0.85,
    transform: [{ scale: 1.02 }],
  },
  taskCardContent: { 
    padding: 12,
  },
  taskHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  priorityChip: { 
    height: 28, 
    borderRadius: 14, 
    paddingHorizontal: 10,
  },
  taskFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12, 
    justifyContent: 'space-between',
  },
  dateContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
};

export const memberStyles = {  
  memberCardContent: { 
    alignItems: 'center',
  },
  memberAvatar: { 
    marginBottom: 8,
  },
};