#!/usr/bin/env python3
"""工时填报系统自动化测试脚本"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
TIMEOUT = 10

# 测试结果
results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "bugs": []
}

def log_test(test_id, name, passed, expected="", actual="", bug_id=None):
    """记录测试结果"""
    results["total"] += 1
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {test_id} | {name}")
    if not passed:
        results["failed"] += 1
        if bug_id:
            results["bugs"].append({
                "id": bug_id,
                "test_id": test_id,
                "name": name,
                "expected": expected,
                "actual": actual
            })
    else:
        results["passed"] += 1

def login(username, password):
    """登录获取 Token"""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": password},
        timeout=TIMEOUT
    )
    return resp.json()

# =====================
# 认证模块测试
# =====================
print("\n" + "="*60)
print("认证模块测试")
print("="*60)

# TC-AUTH-001 用户正常登录
resp = login("admin", "admin123")
passed = resp.get("code") == 0 and "token" in resp.get("data", {})
log_test("TC-AUTH-001", "用户正常登录", passed)
admin_token = resp.get("data", {}).get("token", "") if passed else ""

# TC-AUTH-002 登录-用户名为空
resp = login("", "admin123")
passed = resp.get("code") != 0
log_test("TC-AUTH-002", "登录-用户名为空", passed)

# TC-AUTH-003 登录-密码为空
resp = login("admin", "")
passed = resp.get("code") != 0
log_test("TC-AUTH-003", "登录-密码为空", passed)

# TC-AUTH-004 登录-错误密码
resp = login("admin", "wrongpassword")
passed = resp.get("code") == 1101
log_test("TC-AUTH-004", "登录-错误密码", passed)

# TC-AUTH-005 登录-不存在的用户
resp = login("nonexist", "123456")
passed = resp.get("code") == 1101
log_test("TC-AUTH-005", "登录-不存在的用户", passed)

# TC-AUTH-006 获取当前用户信息-已登录
resp = requests.get(
    f"{BASE_URL}/api/auth/me",
    headers={"Authorization": f"Bearer {admin_token}"},
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-AUTH-006", "获取当前用户信息-已登录", passed)

# TC-AUTH-007 获取当前用户信息-未登录
resp = requests.get(f"{BASE_URL}/api/auth/me", timeout=TIMEOUT)
passed = resp.status_code == 401 or resp.json().get("code") == 1002
log_test("TC-AUTH-007", "获取当前用户信息-未登录", passed)

# TC-AUTH-008 获取当前用户信息-无效Token
resp = requests.get(
    f"{BASE_URL}/api/auth/me",
    headers={"Authorization": "Bearer invalid_token"},
    timeout=TIMEOUT
)
passed = resp.status_code == 401 or resp.json().get("code") == 1002
log_test("TC-AUTH-008", "获取当前用户信息-无效Token", passed)

# =====================
# 工时模块测试
# =====================
print("\n" + "="*60)
print("工时模块测试")
print("="*60)

headers = {"Authorization": f"Bearer {admin_token}"}
today = datetime.now().strftime("%Y-%m-%d")
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
future_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
old_date = (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")

# TC-TS-001 提交工时-正常
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "功能开发", "hours": 4.5, "date": yesterday, "note": "测试备注"},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-TS-001", "提交工时-正常", passed)
timesheet_id = resp.get("data", {}).get("id") if passed else None

# TC-TS-002 提交工时-未登录
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": 4, "date": yesterday},
    timeout=TIMEOUT
)
passed = resp.status_code == 401 or resp.json().get("code") == 1002
log_test("TC-TS-002", "提交工时-未登录", passed)

# TC-TS-003 提交工时-项目不存在
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 9999, "task": "测试", "hours": 4, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2001
log_test("TC-TS-003", "提交工时-项目不存在", passed)

# TC-TS-004 提交工时-日期超出范围（未来日期）
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": 4, "date": future_date},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2002
log_test("TC-TS-004", "提交工时-未来日期", passed)

# TC-TS-005 提交工时-日期超出范围（超过7天前）
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": 4, "date": old_date},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2002
log_test("TC-TS-005", "提交工时-超过7天前", passed)

# TC-TS-006 提交工时-时长为0
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": 0, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2003
log_test("TC-TS-006", "提交工时-时长为0", passed)

# TC-TS-007 提交工时-时长超过24
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": 25, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2003
log_test("TC-TS-007", "提交工时-时长超过24", passed)

# TC-TS-008 提交工时-任务名称为空
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "", "hours": 4, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") != 0
log_test("TC-TS-008", "提交工时-任务名称为空", passed)

# TC-TS-009 提交工时-负数时长
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "测试", "hours": -2, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2003
log_test("TC-TS-009", "提交工时-负数时长", passed)

# TC-TS-010 获取工时列表-正常
resp = requests.get(
    f"{BASE_URL}/api/timesheet",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0 and "items" in resp.get("data", {})
log_test("TC-TS-010", "获取工时列表-正常", passed)

# TC-TS-011 获取工时列表-按日期筛选
resp = requests.get(
    f"{BASE_URL}/api/timesheet?startDate=2026-03-01&endDate=2026-03-20",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-TS-011", "获取工时列表-按日期筛选", passed)

# TC-TS-012 获取工时列表-按项目筛选
resp = requests.get(
    f"{BASE_URL}/api/timesheet?projectId=1",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-TS-012", "获取工时列表-按项目筛选", passed)

# TC-TS-013 获取工时列表-分页
resp = requests.get(
    f"{BASE_URL}/api/timesheet?page=1&pageSize=5",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0 and len(resp.get("data", {}).get("items", [])) <= 5
log_test("TC-TS-013", "获取工时列表-分页", passed)

# TC-TS-014 获取工时详情-正常
if timesheet_id:
    resp = requests.get(
        f"{BASE_URL}/api/timesheet/{timesheet_id}",
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0
    log_test("TC-TS-014", "获取工时详情-正常", passed)
else:
    results["skipped"] += 1
    print("⏭️ SKIP | TC-TS-014 | 获取工时详情-正常 (无记录)")

# TC-TS-015 获取工时详情-不存在
resp = requests.get(
    f"{BASE_URL}/api/timesheet/99999",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2004
log_test("TC-TS-015", "获取工时详情-不存在", passed)

# TC-TS-016 更新工时-正常
if timesheet_id:
    resp = requests.put(
        f"{BASE_URL}/api/timesheet/{timesheet_id}",
        json={"projectId": 1, "task": "修改后", "hours": 5, "date": yesterday},
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0
    log_test("TC-TS-016", "更新工时-正常", passed)
else:
    results["skipped"] += 1
    print("⏭️ SKIP | TC-TS-016 | 更新工时-正常 (无记录)")

# TC-TS-018 删除工时-正常（创建新记录用于删除）
resp = requests.post(
    f"{BASE_URL}/api/timesheet",
    json={"projectId": 1, "task": "待删除", "hours": 1, "date": yesterday},
    headers=headers,
    timeout=TIMEOUT
).json()
delete_id = resp.get("data", {}).get("id")
if delete_id:
    resp = requests.delete(
        f"{BASE_URL}/api/timesheet/{delete_id}",
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0
    log_test("TC-TS-018", "删除工时-正常", passed)
else:
    results["skipped"] += 1
    print("⏭️ SKIP | TC-TS-018 | 删除工时-正常")

# TC-TS-020 删除工时-不存在
resp = requests.delete(
    f"{BASE_URL}/api/timesheet/99999",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 2004
log_test("TC-TS-020", "删除工时-不存在", passed)

# =====================
# 项目模块测试
# =====================
print("\n" + "="*60)
print("项目模块测试")
print("="*60)

# TC-PROJ-001 获取项目列表-正常
resp = requests.get(
    f"{BASE_URL}/api/projects",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0 and isinstance(resp.get("data"), list)
log_test("TC-PROJ-001", "获取项目列表-正常", passed)
projects = resp.get("data", [])

# TC-PROJ-002 获取项目列表-筛选活跃项目
resp = requests.get(
    f"{BASE_URL}/api/projects?status=active",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-PROJ-002", "获取项目列表-筛选活跃项目", passed)

# TC-PROJ-003 创建项目-管理员
resp = requests.post(
    f"{BASE_URL}/api/projects",
    json={"name": f"测试项目_{datetime.now().strftime('%H%M%S')}", "description": "测试描述"},
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-PROJ-003", "创建项目-管理员", passed)
new_project_id = resp.get("data", {}).get("id") if passed else None

# TC-PROJ-006 更新项目-管理员
if new_project_id:
    resp = requests.put(
        f"{BASE_URL}/api/projects/{new_project_id}",
        json={"name": f"更新后项目_{datetime.now().strftime('%H%M%S')}"},
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0
    log_test("TC-PROJ-006", "更新项目-管理员", passed)
else:
    results["skipped"] += 1
    print("⏭️ SKIP | TC-PROJ-006 | 更新项目-管理员")

# TC-PROJ-007 归档项目-管理员
if new_project_id:
    resp = requests.post(
        f"{BASE_URL}/api/projects/{new_project_id}/archive",
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0 and resp.get("data", {}).get("status") == "archived"
    log_test("TC-PROJ-007", "归档项目-管理员", passed)

# TC-PROJ-008 激活项目-管理员
if new_project_id:
    resp = requests.post(
        f"{BASE_URL}/api/projects/{new_project_id}/activate",
        headers=headers,
        timeout=TIMEOUT
    ).json()
    passed = resp.get("code") == 0 and resp.get("data", {}).get("status") == "active"
    log_test("TC-PROJ-008", "激活项目-管理员", passed)

# =====================
# 统计模块测试
# =====================
print("\n" + "="*60)
print("统计模块测试")
print("="*60)

# TC-STAT-001 个人工时统计-按周
resp = requests.get(
    f"{BASE_URL}/api/stats/personal?type=week",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0 and "summary" in resp.get("data", {})
log_test("TC-STAT-001", "个人工时统计-按周", passed)

# TC-STAT-002 个人工时统计-按月
resp = requests.get(
    f"{BASE_URL}/api/stats/personal?type=month",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-STAT-002", "个人工时统计-按月", passed)

# TC-STAT-003 团队工时统计-管理员
resp = requests.get(
    f"{BASE_URL}/api/stats/team?type=week",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0
log_test("TC-STAT-003", "团队工时统计-管理员", passed)

# TC-STAT-005 快速统计
resp = requests.get(
    f"{BASE_URL}/api/stats/summary",
    headers=headers,
    timeout=TIMEOUT
).json()
passed = resp.get("code") == 0 and "today" in resp.get("data", {})
log_test("TC-STAT-005", "快速统计", passed)

# =====================
# 导出模块测试
# =====================
print("\n" + "="*60)
print("导出模块测试")
print("="*60)

# TC-EXP-001 导出Excel-管理员
resp = requests.get(
    f"{BASE_URL}/api/export?format=excel",
    headers=headers,
    timeout=TIMEOUT
)
passed = resp.status_code == 200 and "spreadsheet" in resp.headers.get("Content-Type", "")
log_test("TC-EXP-001", "导出Excel-管理员", passed)

# TC-EXP-002 导出CSV-管理员
resp = requests.get(
    f"{BASE_URL}/api/export?format=csv",
    headers=headers,
    timeout=TIMEOUT
)
passed = resp.status_code == 200 and "csv" in resp.headers.get("Content-Type", "")
log_test("TC-EXP-002", "导出CSV-管理员", passed)

# =====================
# 输出结果汇总
# =====================
print("\n" + "="*60)
print("测试结果汇总")
print("="*60)
print(f"用例总数: {results['total']}")
print(f"通过: {results['passed']}")
print(f"失败: {results['failed']}")
print(f"跳过: {results['skipped']}")
pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
print(f"通过率: {pass_rate:.1f}%")

if results['bugs']:
    print("\n缺陷列表:")
    for bug in results['bugs']:
        print(f"  - {bug['id']}: {bug['name']}")

# 输出 JSON 结果
print("\n" + "="*60)
print("JSON 结果")
print("="*60)
print(json.dumps(results, ensure_ascii=False, indent=2))
