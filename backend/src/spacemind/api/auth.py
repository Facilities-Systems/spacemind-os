"""
SpaceMind OS — Authentication
JWT-based auth using python-jose + passlib.
Routes: POST /auth/register, POST /auth/login
Dependency: get_current_user — inject into any protected route.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.domain.models import User
from spacemind.storage.database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─── Schemas ─────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "viewer"   # Callers cannot self-assign admin — enforced in the route


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Helpers ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


# ─── RBAC ─────────────────────────────────────────────────────────────────────

_ROLE_HIERARCHY = {
    "viewer":              0,
    "technician":          1,
    "facilities_manager":  2,
    "admin":               3,
}


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory for role-based access control.
    Usage:
        @router.post("/decompose")
        def decompose(_: User = Depends(require_role("facilities_manager", "admin"))):
            ...
    """
    min_level = min(_ROLE_HIERARCHY.get(r, 0) for r in allowed_roles)

    def _check(current_user: User = Depends(get_current_user)) -> User:
        user_level = _ROLE_HIERARCHY.get(current_user.role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {' or '.join(allowed_roles)}.",
            )
        return current_user

    return _check


# ─── Dependency ──────────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserOut, status_code=201, summary="Register a new user")
def register(body: UserRegister, db: Session = Depends(get_db)) -> User:
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    # Security: only admin can create admin accounts. Self-registration is limited to viewer/technician/facilities_manager.
    safe_roles = {"viewer", "technician", "facilities_manager"}
    assigned_role = body.role if body.role in safe_roles else "viewer"

    user = User(
        id=str(uuid4()),
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=assigned_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log.info(f"Registered new user: {user.email} (role={user.role})")
    return user


@router.post("/login", response_model=Token, summary="Login and receive access token")
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = get_user_by_email(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    log.info(f"Login: {user.email}")
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut, summary="Get current user profile")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


# ─── User Management (admin only) ─────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut], summary="List all users (admin)")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserOut, summary="Update user role or status (admin)")
def update_user(
    user_id: str,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.role is not None:
        valid_roles = {"viewer", "technician", "facilities_manager", "admin"}
        if body.role not in valid_roles:
            raise HTTPException(status_code=422, detail=f"Invalid role. Must be one of: {valid_roles}")
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    log.info(f"Admin updated user {user.email}: role={user.role} active={user.is_active}")
    return user


@router.post("/users/{user_id}/deactivate", response_model=UserOut, summary="Deactivate a user account (admin)")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    user.is_active = False
    db.commit()
    db.refresh(user)
    log.info(f"Admin deactivated user: {user.email}")
    return user
