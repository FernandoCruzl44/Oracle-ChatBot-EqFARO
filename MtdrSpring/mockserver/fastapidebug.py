from fastapi import FastAPI, HTTPException, Depends, Cookie, Response
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    Table,
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from enum import Enum

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Constants
class UserRole(str, Enum):
    DEVELOPER = "developer"
    MANAGER = "manager"

# Database models
task_assignee = Table(
    "task_assignee",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id")),
    Column("user_id", Integer, ForeignKey("users.id")),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default=UserRole.DEVELOPER)
    telegramId = Column(String, nullable=True)
    chatId = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team_role = Column(String, nullable=True, default="member")
    team = relationship("Team", back_populates="members")
    created_tasks = relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by_id"
    )
    assigned_tasks = relationship(
        "Task", secondary=task_assignee, back_populates="assignees"
    )

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    members = relationship("User", back_populates="team")
    tasks = relationship("Task", back_populates="team")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tag = Column(String, nullable=False)
    status = Column(
        String, nullable=False, default="Backlog"
    )  # Allowed: "En progreso", "Cancelada", "Backlog", "Completada"
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship(
        "User", back_populates="created_tasks", foreign_keys=[created_by_id]
    )
    assignees = relationship(
        "User", secondary=task_assignee, back_populates="assigned_tasks"
    )
    team = relationship("Team", back_populates="tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="comments")
    creator = relationship("User")

Base.metadata.create_all(bind=engine)

# Initialize default users and team
def initialize_database():
    db = SessionLocal()
    try:
        existing_users = db.query(User).all()
        if not existing_users:
            print("Initializing database with default users and team...")

            teams = [
                Team(nombre="Equipo Frontend", description="Equipo de desarrollo frontend"),
                Team(nombre="Equipo Backend", description="Equipo de desarrollo backend"),
            ]

            for team in teams:
                db.add(team)

            db.commit()
            db.refresh(teams[0])
            db.refresh(teams[1])

            users = [
                User(
                    nombre="Manager User",
                    email="manager@example.com",
                    password="manager123",
                    role=UserRole.MANAGER,
                    telegramId="manager_telegram",
                ),
                User(
                    nombre="Dev One",
                    email="dev1@example.com",
                    password="dev123",
                    role=UserRole.DEVELOPER,
                    telegramId="dev1_telegram",
                    team_id=teams[0].id,
                    team_role="lead",
                ),
                User(
                    nombre="Dev Two",
                    email="dev2@example.com",
                    password="dev123",
                    role=UserRole.DEVELOPER,
                    telegramId="dev2_telegram",
                    team_id=teams[0].id,
                    team_role="member",
                ),
                User(
                    nombre="Dev Three",
                    email="dev3@example.com",
                    password="dev123",
                    role=UserRole.DEVELOPER,
                    telegramId="dev3_telegram",
                    team_id=teams[1].id,
                    team_role="lead",
                ),
                User(
                    nombre="Dev Four",
                    email="dev4@example.com",
                    password="dev123",
                    role=UserRole.DEVELOPER,
                    telegramId="dev4_telegram",
                    team_id=teams[1].id,
                    team_role="member",
                ),
            ]

            for user in users:
                db.add(user)

            db.commit()

            print("Database initialization complete!")
        else:
            print(
                f"Database already contains {len(existing_users)} users. Skipping"
                " initialization."
            )
    finally:
        db.close()

initialize_database()

# Helper functions
def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "nombre": user.nombre,
        "email": user.email,
        "role": user.role,
        "telegramId": user.telegramId,
        "chatId": user.chatId,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "team": {
            "id": user.team.id,
            "nombre": user.team.nombre,
            "role": user.team_role,
        }
        if user.team
        else None,
    }

def team_to_dict(team: Team) -> dict:
    return {
        "id": team.id,
        "nombre": team.nombre,
        "description": team.description,
        "created_at": team.created_at.isoformat() if team.created_at else None,
        "members": [
            {
                "id": member.id,
                "nombre": member.nombre,
                "role": member.team_role,
            }
            for member in team.members
        ],
    }

def task_to_dict(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "tag": task.tag,
        "status": task.status,
        "startDate": task.start_date,
        "endDate": task.end_date,
        "created_by": task.creator.nombre if task.creator else None,
        "team": task.team.nombre if task.team else None,
        "assignees": [user.nombre for user in task.assignees],
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }

def comment_to_dict(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "task_id": comment.task_id,
        "content": comment.content,
        "created_by": comment.creator.nombre if comment.creator else None,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    current_user_id: Optional[str] = Cookie(None, alias="user_id"),
    db=Depends(get_db),
):
    if not current_user_id:
        return None

    try:
        user_id = int(current_user_id)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except (ValueError, TypeError):
        return None

# FastAPI instance
app = FastAPI()

# Endpoints
@app.get("/api/")
def root():
    return {"message": "Task Management API"}

# Identity Management
@app.post("/api/identity/set/{user_id}")
def set_user_identity(user_id: int, response: Response, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    response.set_cookie(key="user_id", value=str(user_id), max_age=86400)  

    return {"message": f"Identity set to: {user.nombre} ({user.role})"}

@app.get("/api/identity/current")
def get_current_identity(current_user=Depends(get_current_user)):
    if not current_user:
        return {"message": "No identity set"}

    return user_to_dict(current_user)

@app.post("/api/identity/clear")
def clear_identity(response: Response):
    response.delete_cookie(key="user_id")
    return {"message": "Identity cleared"}

# User Endpoints
@app.post("/api/users/")
def create_user(user_data: dict, db=Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.get("email")).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        nombre=user_data.get("nombre"),
        email=user_data.get("email"),
        password=user_data.get("password"),
        role=user_data.get("role", UserRole.DEVELOPER),
        telegramId=user_data.get("telegramId"),
        chatId=user_data.get("chatId"),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return user_to_dict(db_user)

@app.get("/api/users/")
def get_users(db=Depends(get_db), skip: int = 0, limit: int = 100):
    users = db.query(User).offset(skip).limit(limit).all()
    return [user_to_dict(user) for user in users]

@app.get("/api/users/{user_id}")
def get_user(user_id: int, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_dict(user)

@app.put("/api/users/{user_id}")
def update_user(user_id: int, user_data: dict, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "nombre" in user_data:
        user.nombre = user_data["nombre"]
    if "email" in user_data:
        user.email = user_data["email"]
    if "role" in user_data:
        user.role = user_data["role"]
    if "telegramId" in user_data:
        user.telegramId = user_data["telegramId"]
    if "chatId" in user_data:
        user.chatId = user_data["chatId"]
    if "password" in user_data:
        user.password = user_data["password"]

    db.commit()
    db.refresh(user)
    return user_to_dict(user)

@app.put("/api/users/{user_id}/team")
def assign_user_to_team(
    user_id: int,
    team_data: dict,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="No user identity set")

    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=403, detail="Only managers can assign users to teams"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    team_id = team_data.get("team_id")
    team_role = team_data.get("role", "member")

    if team_id is None:
        user.team_id = None
        user.team_role = None
        db.commit()
        return {"message": f"User {user.nombre} removed from team"}

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user.team_id = team.id
    user.team_role = team_role
    db.commit()
    db.refresh(user)

    return {
        "message": f"User {user.nombre} assigned to team {team.nombre} as"
        f" {team_role}"
    }

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db=Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

# Team Endpoints
@app.post("/api/teams/")
def create_team(team_data: dict, db=Depends(get_db)):
    new_team = Team(
        nombre=team_data.get("nombre"), description=team_data.get("description")
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return team_to_dict(new_team)

@app.get("/api/teams/")
def get_teams(db=Depends(get_db), skip: int = 0, limit: int = 100):
    teams = db.query(Team).offset(skip).limit(limit).all()
    return [team_to_dict(team) for team in teams]

@app.get("/api/teams/{team_id}")
def get_team(team_id: int, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team_to_dict(team)

@app.put("/api/teams/{team_id}")
def update_team(team_id: int, team_data: dict, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if "nombre" in team_data:
        team.nombre = team_data["nombre"]
    if "description" in team_data:
        team.description = team_data["description"]

    db.commit()
    db.refresh(team)
    return team_to_dict(team)

@app.delete("/api/teams/{team_id}")
def delete_team(team_id: int, db=Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}

@app.get("/api/users/me/team")
def get_current_user_team(db=Depends(get_db), current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="No user identity set")

    if not current_user.team:
        return {"message": "User is not assigned to any team"}

    return {
        "id": current_user.team.id,
        "nombre": current_user.team.nombre,
        "description": current_user.team.description,
        "role": current_user.team_role,
    }

# Task Endpoints
@app.post("/api/tasks/")
def create_task(
    task_data: dict,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="No user identity set. Please select a user.",
        )

    if "created_by_id" not in task_data:
        task_data["created_by_id"] = current_user.id

    status = task_data.get("status", "Backlog")
    allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    creator_id = task_data.get("created_by_id")
    creator = db.query(User).filter(User.id == creator_id).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator user not found")

    if current_user.role != UserRole.MANAGER:
        if not current_user.team:
            raise HTTPException(
                status_code=400,
                detail="Developer must belong to a team to create tasks.",
            )

        task_data["team_id"] = current_user.team_id
    elif "team_id" not in task_data:
        raise HTTPException(status_code=400, detail="Team is required for managers")

    team_id = task_data.get("team_id")
    if team_id:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")

    new_task = Task(
        title=task_data.get("title"),
        description=task_data.get("description"),
        tag=task_data.get("tag"),
        status=status,
        start_date=task_data.get("startDate"),
        end_date=task_data.get("endDate"),
        created_by_id=creator_id,
        team_id=team_id,
    )

    assignee_ids = task_data.get("assignee_ids", [])
    if assignee_ids:
        for user_id in assignee_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                new_task.assignees.append(user)

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return task_to_dict(new_task)

@app.get("/api/tasks/")
def get_tasks(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    view_mode: str = "assigned",  # "assigned" = mis tareas, "team" = tareas del equipo
    team_id: Optional[int] = None,
    status: Optional[str] = None,
    tag: Optional[str] = None,
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
):
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="No user identity set. Please select a user.",
        )

    query = db.query(Task)

    if view_mode == "assigned":
        if current_user.role != UserRole.MANAGER:
            query = query.filter(Task.assignees.any(User.id == current_user.id))
    elif view_mode == "team":
        if current_user.role != UserRole.MANAGER:
            if not current_user.team:
                return []
            query = query.filter(Task.team_id == current_user.team_id)
        elif team_id:
            query = query.filter(Task.team_id == team_id)

    if status:
        query = query.filter(Task.status == status)

    if tag:
        query = query.filter(Task.tag == tag)

    if assigned_to:
        if current_user.role == UserRole.MANAGER:
            query = query.filter(Task.assignees.any(User.id == assigned_to))
        else:
            if assigned_to != current_user.id:
                query = query.filter(Task.assignees.any(User.id == current_user.id))

    if created_by:
        query = query.filter(Task.created_by_id == created_by)

    tasks = query.offset(skip).limit(limit).all()
    return [task_to_dict(task) for task in tasks]

@app.get("/api/tasks/{task_id}")
def get_task(task_id: int, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_dict(task)

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task_data: dict, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if "title" in task_data:
        task.title = task_data["title"]
    if "description" in task_data:
        task.description = task_data["description"]
    if "tag" in task_data:
        task.tag = task_data["tag"]
    if "status" in task_data:
        allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
        if task_data["status"] not in allowed_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        task.status = task_data["status"]
    if "startDate" in task_data:
        task.start_date = task_data["startDate"]
    if "endDate" in task_data:
        task.end_date = task_data["endDate"]
    if "team_id" in task_data:
        team_id = task_data["team_id"]
        if team_id:
            team = db.query(Team).filter(Team.id == team_id).first()
            if not team:
                raise HTTPException(status_code=404, detail="Team not found")
        task.team_id = team_id

    if "assignee_ids" in task_data:
        task.assignees = []
        for user_id in task_data["assignee_ids"]:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                task.assignees.append(user)

    db.commit()
    db.refresh(task)
    return task_to_dict(task)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}

@app.put("/api/tasks/{task_id}/status")
def update_task_status(task_id: int, status_data: dict, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    status = status_data.get("status")
    allowed_statuses = ["En progreso", "Cancelada", "Backlog", "Completada"]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    task.status = status
    db.commit()
    db.refresh(task)

    return task_to_dict(task)

@app.put("/api/tasks/{task_id}/assign")
def assign_task(task_id: int, assign_data: dict, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.assignees = []
    for user_id in assign_data.get("assignee_ids", []):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            task.assignees.append(user)

    db.commit()
    db.refresh(task)
    return task_to_dict(task)

@app.delete("/api/tasks/")
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

# Comment Endpoints
@app.post("/api/tasks/{task_id}/comments")
def create_comment(
    task_id: int,
    comment_data: dict,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if "created_by_id" not in comment_data and current_user:
        comment_data["created_by_id"] = current_user.id

    if "created_by_id" not in comment_data:
        raise HTTPException(
            status_code=400,
            detail="Comment creator not specified and no current user identity",
        )

    user_id = comment_data.get("created_by_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_comment = Comment(
        task_id=task_id,
        content=comment_data.get("content"),
        created_by_id=user_id,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return comment_to_dict(new_comment)

@app.get("/api/tasks/{task_id}/comments")
def get_comments(task_id: int, db=Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comments = db.query(Comment).filter(Comment.task_id == task_id).all()
    return [comment_to_dict(comment) for comment in comments]

@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, db=Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}

# Debug Endpoint
@app.get("/api/debug")
def debug():
    return JSONResponse({"message": "Ok buddy dev"})

# Health Check Endpoint
@app.get("/api/healthcheck", status_code=204)
def healthcheck():
    return None
