from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

# 加载环境变量
load_dotenv()

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接
def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cur
        conn.commit()
    finally:
        cur.close()
        conn.close()

# 创建users表（如果不存在）
def init_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'regular',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        cur.close()
        conn.close()

# 安全配置
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# 模型定义
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

# 用户认证相关函数
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = db.fetchone()
    if user is None:
        raise credentials_exception
    return user

# 路由
@app.post("/api/register")
async def register(user: UserCreate, db = Depends(get_db)):
    try:
        # 检查用户名是否已存在
        db.execute("SELECT * FROM users WHERE username = %s", (user.username,))
        if db.fetchone():
            raise HTTPException(
                status_code=400,
                detail="用户名已存在"
            )
        
        # 加密密码
        hashed_password = get_password_hash(user.password)
        
        # 插入新用户
        db.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s) RETURNING id",
            (user.username, hashed_password, "regular")
        )
        user_id = db.fetchone()['id']
        
        return {"message": "注册成功", "user_id": user_id}
    except Exception as e:
        print(f"Registration error: {str(e)}")  # 添加日志
        raise HTTPException(
            status_code=500,
            detail=f"注册失败: {str(e)}"
        )

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    db.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = db.fetchone()
    if not user or not verify_password(form_data.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token({"sub": user['username']})
    return {"access_token": access_token, "token_type": "bearer", "role": user['role']}

@app.get("/api/jobs")
async def get_jobs(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if current_user['role'] == 'regular':
        # 普通用户只能看到UQ的工作
        db.execute("""
            SELECT id, job_title, uni_name, link 
            FROM jobs 
            WHERE uni_name = 'UQ'
        """)
    else:
        # VIP和超级管理员可以看到所有工作
        db.execute("SELECT id, job_title, uni_name, link FROM jobs")
    
    return db.fetchall()

@app.get("/api/jobs/search")
async def search_jobs(
    keyword: str, 
    current_user: dict = Depends(get_current_user), 
    db = Depends(get_db)
):
    if current_user['role'] == 'regular':
        db.execute("""
            SELECT id, job_title, uni_name, link 
            FROM jobs 
            WHERE uni_name = 'UQ' 
            AND (job_title ILIKE %s OR uni_name ILIKE %s)
        """, (f'%{keyword}%', f'%{keyword}%'))
    else:
        db.execute("""
            SELECT id, job_title, uni_name, link 
            FROM jobs 
            WHERE job_title ILIKE %s OR uni_name ILIKE %s
        """, (f'%{keyword}%', f'%{keyword}%'))
    
    return db.fetchall()

@app.get("/api/users")
async def get_users(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    if current_user['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail="没有权限访问")
    
    db.execute("SELECT id, username, role FROM users")
    return db.fetchall()

@app.put("/api/users/{user_id}")
async def update_user_role(
    user_id: int, 
    role: str, 
    current_user: dict = Depends(get_current_user), 
    db = Depends(get_db)
):
    if current_user['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail="没有权限修改")
    
    if role not in ['regular', 'vip', 'super_admin']:
        raise HTTPException(status_code=400, detail="无效的角色类型")
    
    db.execute(
        "UPDATE users SET role = %s WHERE id = %s",
        (role, user_id)
    )
    return {"message": "更新成功"}

# 在应用启动时初始化数据库
@app.on_event("startup")
async def startup_event():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000) 