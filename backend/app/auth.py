import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)
SECRET = os.environ['JWT_SECRET_KEY']
ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
TOKEN_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', '60'))


def get_db():
    with SessionLocal() as session:
        yield session


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    return password_hash.verify(password, encoded)


def make_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({
        'sub': str(user.id),
        'iat': now,
        'exp': now + timedelta(minutes=TOKEN_MINUTES),
    }, SECRET, algorithm=ALGORITHM)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    failed = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Missing, invalid, or expired access token',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    if not credentials:
        raise failed
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=[ALGORITHM])
        subject = payload.get('sub')
        user_id = int(subject)
    except (InvalidTokenError, ValueError, TypeError):
        raise failed from None
    user = db.get(User, user_id)
    if user is None:
        raise failed
    return user


def require_instructor(user: User = Depends(current_user)) -> User:
    if user.role != 'INSTRUCTOR':
        raise HTTPException(status_code=403, detail='Instructor access required')
    return user
