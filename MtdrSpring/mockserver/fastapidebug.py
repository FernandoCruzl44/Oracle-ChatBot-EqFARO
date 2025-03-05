from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# =============================================================================
# DATABASE SETUP
# =============================================================================

# Using a local SQLite database file named tasks.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# =============================================================================
# DATABASE MODELS
# =============================================================================


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    tag = Column(String, nullable=False)  # e.g. "Feature" or "Issue"
    status = Column(
        String, nullable=False, default="Backlog"
    )  # Allowed: "En progreso", "Cancelada", "Backlog", "Completada"
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    created_by = Column(String, nullable=False)
    comments = relationship(
        "Comment", back_populates="task", cascade="all, delete"
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(String, default="Mock User")
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="comments")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    role = Column(String, nullable=True)
    email = Column(String, nullable=False, unique=True)
    telegramId = Column(String, nullable=True)
    chatId = Column(String, nullable=True)
    phone = Column(String, nullable=True)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    description = Column(String, nullable=True)


# Create all the tables in the database (if they don’t exist)
Base.metadata.create_all(bind=engine)

# =============================================================================
# PYDANTIC MODELS
# =============================================================================
# For consistency with your frontend’s naming, the Task Pydantic models use
# camelCase (e.g. startDate, createdBy)


class TaskBase(BaseModel):
    title: str
    tag: str
    startDate: str
    endDate: Optional[str] = None
    createdBy: str


class TaskCreate(TaskBase):
    status: Optional[str] = "Backlog"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    tag: Optional[str] = None
    status: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    createdBy: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    status: str

    model_config = {'from_attributes': True}


class StatusUpdate(BaseModel):
    status: str


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    created_by: Optional[str] = "Mock User"


class CommentResponse(CommentBase):
    id: int
    task_id: int
    created_by: str
    created_at: datetime

    model_config = {'from_attributes': True}


class UserBase(BaseModel):
    nombre: str
    role: Optional[str] = None
    email: str
    telegramId: Optional[str] = None
    chatId: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int

    model_config = {'from_attributes': True}


class TeamBase(BaseModel):
    nombre: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int

    model_config = {'from_attributes': True}


# =============================================================================
# FASTAPI INSTANCE & DEPENDENCIES
# =============================================================================

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# A small utility function to map a Task (SQLAlchemy model) to a TaskResponse
def task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        tag=task.tag,
        status=task.status,
        startDate=task.start_date,
        endDate=task.end_date,
        createdBy=task.created_by,
    )


# =============================================================================
# ENDPOINTS
# =============================================================================

# ---- Root
@app.get("/api/")
def root():
    return {"message": "Hello World"}


# ---- TASKS Endpoints
@app.get("/api/tasks/", response_model=List[TaskResponse], tags=["Tasks"])
def get_tasks(db=Depends(get_db)):
    tasks = db.query(Task).all()
    return [task_to_response(task) for task in tasks]


@app.get("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(task_id: int, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_response(task)


@app.post("/api/tasks/", response_model=TaskResponse, tags=["Tasks"])
def create_task(task: TaskCreate, db=Depends(get_db)):
    allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
    if task.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    new_task = Task(
        title=task.title,
        tag=task.tag,
        status=task.status,
        start_date=task.startDate,
        end_date=task.endDate,
        created_by=task.createdBy,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return task_to_response(new_task)


@app.put("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(task_id: int, task_update: TaskUpdate, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.tag is not None:
        task.tag = task_update.tag
    if task_update.status is not None:
        allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
        if task_update.status not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        task.status = task_update.status
    if task_update.startDate is not None:
        task.start_date = task_update.startDate
    if task_update.endDate is not None:
        task.end_date = task_update.endDate
    if task_update.createdBy is not None:
        task.created_by = task_update.createdBy
    db.commit()
    db.refresh(task)
    return task_to_response(task)


@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
def delete_task(task_id: int, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@app.delete("/api/tasks/", tags=["Tasks"])
def delete_tasks(task_ids: List[int], db=Depends(get_db)):
    for task_id in task_ids:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(
                status_code=404, detail=f"Task with id {task_id} not found"
            )
        db.delete(task)
    db.commit()
    return {"message": "Tasks deleted"}


# A specialized endpoint for updating just the task status
@app.put("/api/tasks/{task_id}/status",
         response_model=TaskResponse,
         tags=["Tasks"])
def update_task_status(task_id: int,
                       status_update: StatusUpdate,
                       db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
    if status_update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    task.status = status_update.status
    db.commit()
    db.refresh(task)
    return task_to_response(task)


# ---- COMMENTS Endpoints
@app.post("/api/tasks/{task_id}/comments",
          response_model=CommentResponse,
          tags=["Comments"])
def create_comment(task_id: int,
                   comment: CommentCreate,
                   db=Depends(get_db)):
    # Verify that the task exists
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    new_comment = Comment(
        task_id=task_id,
        content=comment.content,
        created_by=comment.created_by,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@app.get("/api/tasks/{task_id}/comments",
         response_model=List[CommentResponse],
         tags=["Comments"])
def get_comments(task_id: int, db=Depends(get_db)):
    comments = db.query(Comment).filter(Comment.task_id == task_id).all()
    return [CommentResponse.model_validate(comment) for comment in comments]


@app.delete("/api/comments/{comment_id}", tags=["Comments"])
def delete_comment(comment_id: int, db=Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}


# ---- USERS Endpoints
@app.get("/api/users/", response_model=List[UserResponse], tags=["Users"])
def get_users(db=Depends(get_db)):
    users = db.query(User).all()
    return users


@app.get("/api/users/{user_id}", response_model=UserResponse, tags=["Users"])
def get_user(user_id: int, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/api/users/", response_model=UserResponse, tags=["Users"])
def create_user(user: UserCreate, db=Depends(get_db)):
    new_user = User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.put("/api/users/{user_id}", response_model=UserResponse, tags=["Users"])
def update_user(user_id: int, user_update: UserCreate, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/users/{user_id}", tags=["Users"])
def delete_user(user_id: int, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ---- TEAMS Endpoints
@app.get("/api/teams/", response_model=List[TeamResponse], tags=["Teams"])
def get_teams(db=Depends(get_db)):
    teams = db.query(Team).all()
    return teams


@app.get("/api/teams/{team_id}", response_model=TeamResponse, tags=["Teams"])
def get_team(team_id: int, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@app.post("/api/teams/", response_model=TeamResponse, tags=["Teams"])
def create_team(team: TeamCreate, db=Depends(get_db)):
    new_team = Team(**team.dict())
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@app.put("/api/teams/{team_id}", response_model=TeamResponse, tags=["Teams"])
def update_team(team_id: int, team_update: TeamCreate, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    for key, value in team_update.dict(exclude_unset=True).items():
        setattr(team, key, value)
    db.commit()
    db.refresh(team)
    return team


@app.delete("/api/teams/{team_id}", tags=["Teams"])
def delete_team(team_id: int, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}


# ---- Debug Endpoint
@app.get("/api/debug", tags=["Debug"])
def debug():
    return JSONResponse({"message": "Ok buddy dev"})
