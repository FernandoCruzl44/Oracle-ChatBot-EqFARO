from fastapi import FastAPI

app = FastAPI()
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, date
import uvicorn
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Date, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

app = FastAPI(title="Task Management API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./task_management.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class UserDB(Base):
    __tablename__ = "users"
    
    userid = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    telegramid = Column(String(255))
    chatid = Column(String(255))
    phone = Column(String(255))
    usertype = Column(String(20), nullable=False)
    
    # Relationships
    teams_managed = relationship("TeamDB", back_populates="manager")
    team_roles = relationship("TeamRoleDB", back_populates="user")

class TeamDB(Base):
    __tablename__ = "teams"
    
    teamid = Column(Integer, primary_key=True, index=True)
    managerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    nombre = Column(String(255), nullable=False)
    description = Column(String(255))
    
    # Relationships
    manager = relationship("UserDB", back_populates="teams_managed")
    tasks = relationship("TaskDB", back_populates="team")
    team_roles = relationship("TeamRoleDB", back_populates="team")

class TeamRoleDB(Base):
    __tablename__ = "teamroles"
    
    roleid = Column(Integer, primary_key=True, index=True)
    teamid = Column(Integer, ForeignKey("teams.teamid"), nullable=False)
    rolename = Column(String(255), nullable=False)
    assigneduserid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    
    # Relationships
    team = relationship("TeamDB", back_populates="team_roles")
    user = relationship("UserDB", back_populates="team_roles")
    tasks = relationship("TaskDB", back_populates="role")

class TaskDB(Base):
    __tablename__ = "tasks"
    
    taskid = Column(Integer, primary_key=True, index=True)
    teamid = Column(Integer, ForeignKey("teams.teamid"), nullable=False)
    roleid = Column(Integer, ForeignKey("teamroles.roleid"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(2000))
    status = Column(String(50), nullable=False)
    priority = Column(String(50))
    fechacreacion = Column(Date, nullable=False)
    fechainicio = Column(Date)
    fechafin = Column(Date)
    storypoints = Column(Integer)
    tiempoinvertido = Column(Float)
    tag = Column(String(50))  # Added to match the interface
    
    # Relationships
    team = relationship("TeamDB", back_populates="tasks")
    role = relationship("TeamRoleDB", back_populates="tasks")
    comments = relationship("TaskCommentDB", back_populates="task")

class TaskCommentDB(Base):
    __tablename__ = "taskcomment"
    
    commentid = Column(Integer, primary_key=True, index=True)
    taskid = Column(Integer, ForeignKey("tasks.taskid"), nullable=False)
    creationtime = Column(Date, nullable=False)
    commenttext = Column(String(1000), nullable=False)
    
    # Relationships
    task = relationship("TaskDB", back_populates="comments")

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class UserBase(BaseModel):
    nombre: str
    email: str
    telegramid: Optional[str] = None
    chatid: Optional[str] = None
    phone: Optional[str] = None
    usertype: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    userid: int
    
    class Config:
        orm_mode = True

class TeamBase(BaseModel):
    nombre: str
    description: Optional[str] = None
    managerid: int

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    teamid: int
    
    class Config:
        orm_mode = True

class TeamRoleBase(BaseModel):
    teamid: int
    rolename: str
    assigneduserid: int

class TeamRoleCreate(TeamRoleBase):
    pass

class TeamRole(TeamRoleBase):
    roleid: int
    
    class Config:
        orm_mode = True

class TaskCommentBase(BaseModel):
    taskid: int
    commenttext: str

class TaskCommentCreate(TaskCommentBase):
    pass

class TaskComment(TaskCommentBase):
    commentid: int
    creationtime: date
    
    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    teamid: int
    roleid: int
    title: str
    description: Optional[str] = None
    status: str
    priority: Optional[str] = None
    tag: Optional[Literal["Feature", "Issue"]] = None
    storypoints: Optional[int] = None
    tiempoinvertido: Optional[float] = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    taskid: int
    fechacreacion: date
    fechainicio: Optional[date] = None
    fechafin: Optional[date] = None
    
    # Matching the provided interface
    id: int = Field(..., alias="taskid")
    startDate: str = Field(..., alias="fechainicio")
    endDate: Optional[str] = Field(None, alias="fechafin")
    createdBy: str
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "Welcome to Task Management API"}

# User endpoints
@app.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserDB(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(UserDB).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.userid == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# Team endpoints
@app.post("/teams/", response_model=Team)
def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    db_team = TeamDB(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@app.get("/teams/", response_model=List[Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teams = db.query(TeamDB).offset(skip).limit(limit).all()
    return teams

# Team Role endpoints
@app.post("/team-roles/", response_model=TeamRole)
def create_team_role(team_role: TeamRoleCreate, db: Session = Depends(get_db)):
    db_team_role = TeamRoleDB(**team_role.dict())
    db.add(db_team_role)
    db.commit()
    db.refresh(db_team_role)
    return db_team_role

@app.get("/team-roles/", response_model=List[TeamRole])
def read_team_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    team_roles = db.query(TeamRoleDB).offset(skip).limit(limit).all()
    return team_roles

# Task endpoints
@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    task_data = task.dict()
    task_data["fechacreacion"] = date.today()
    task_data["fechainicio"] = date.today()
    
    db_task = TaskDB(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Get creator info for the response
    role = db.query(TeamRoleDB).filter(TeamRoleDB.roleid == task.roleid).first()
    user = db.query(UserDB).filter(UserDB.userid == role.assigneduserid).first()
    
    # Set the fields needed for the response
    setattr(db_task, "createdBy", user.nombre)
    
    return db_task

@app.get("/tasks/", response_model=List[Task])
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TaskDB)
    
    if status:
        query = query.filter(TaskDB.status == status)
    
    if tag:
        query = query.filter(TaskDB.tag == tag)
    
    tasks = query.offset(skip).limit(limit).all()
    
    # Attach created_by information
    for task in tasks:
        role = db.query(TeamRoleDB).filter(TeamRoleDB.roleid == task.roleid).first()
        user = db.query(UserDB).filter(UserDB.userid == role.assigneduserid).first()
        setattr(task, "createdBy", user.nombre)
    
    return tasks

@app.get("/tasks/{task_id}", response_model=Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.taskid == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Attach created_by information
    role = db.query(TeamRoleDB).filter(TeamRoleDB.roleid == db_task.roleid).first()
    user = db.query(UserDB).filter(UserDB.userid == role.assigneduserid).first()
    setattr(db_task, "createdBy", user.nombre)
    
    return db_task

# Task Comment endpoints
@app.post("/task-comments/", response_model=TaskComment)
def create_task_comment(task_comment: TaskCommentCreate, db: Session = Depends(get_db)):
    db_task_comment = TaskCommentDB(**task_comment.dict(), creationtime=date.today())
    db.add(db_task_comment)
    db.commit()
    db.refresh(db_task_comment)
    return db_task_comment

@app.get("/task-comments/", response_model=List[TaskComment])
def read_task_comments(task_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(TaskCommentDB)
    
    if task_id:
        query = query.filter(TaskCommentDB.taskid == task_id)
    
    task_comments = query.offset(skip).limit(limit).all()
    return task_comments

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
