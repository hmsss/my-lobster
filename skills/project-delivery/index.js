/**
 * Project Delivery Skill - 项目交付管理
 * 
 * 统一管理项目产出物的提交和交付流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/root/.openclaw/workspace';
const PROJECTS_DIR = path.join(WORKSPACE, 'projects');
const REPO_DIR = '/root/.openclaw/workspace/my-lobster';
const REPO_PROJECTS_DIR = path.join(REPO_DIR, 'projects');

// ============================================
// Git 操作
// ============================================

function gitExec(cmd, cwd = REPO_DIR) {
  try {
    return execSync(`git ${cmd}`, { 
      cwd, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    return { error: true, message: e.message };
  }
}

function isInRepo(dir) {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============================================
// 项目管理
// ============================================

function listProjects() {
  const projects = [];
  
  // 从 workspace/projects 读取
  if (fs.existsSync(PROJECTS_DIR)) {
    const dirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const name of dirs) {
      projects.push({ name, location: 'workspace', path: path.join(PROJECTS_DIR, name) });
    }
  }
  
  // 从 my-lobster/projects 读取
  if (fs.existsSync(REPO_PROJECTS_DIR)) {
    const dirs = fs.readdirSync(REPO_PROJECTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const name of dirs) {
      if (!projects.find(p => p.name === name)) {
        projects.push({ name, location: 'repo', path: path.join(REPO_PROJECTS_DIR, name) });
      }
    }
  }
  
  return projects;
}

function getProjectStatus(projectName) {
  const projectPath = path.join(PROJECTS_DIR, projectName);
  const repoPath = path.join(REPO_PROJECTS_DIR, projectName);
  
  const status = {
    name: projectName,
    workspace: fs.existsSync(projectPath),
    repo: fs.existsSync(repoPath),
    committed: false,
    pushed: false
  };
  
  // 检查 git 状态
  if (isInRepo(REPO_DIR)) {
    const result = gitExec(`status --porcelain projects/${projectName}`);
    status.committed = !result || result.length === 0;
    
    const logResult = gitExec(`log origin/main --oneline -1 -- projects/${projectName}`);
    status.pushed = logResult && !logResult.error;
  }
  
  return status;
}

// ============================================
// 导出函数
// ============================================

module.exports = {
  name: 'project-delivery',
  description: '项目交付管理',

  /**
   * 员工：提交产出物到本地仓库
   * @param {string} projectName - 项目名称
   * @param {string} agentId - Agent ID (如 product-manager)
   * @param {string} message - 提交信息
   */
  commitOutput(projectName, agentId, message = '') {
    const projectPath = path.join(PROJECTS_DIR, projectName);
    if (!fs.existsSync(projectPath)) {
      return { error: true, message: `项目 ${projectName} 不存在` };
    }

    // 复制到仓库
    const repoProjectPath = path.join(REPO_PROJECTS_DIR, projectName);
    execSync(`mkdir -p ${REPO_PROJECTS_DIR}`, { stdio: 'pipe' });
    
    // 使用 rsync 或 cp 复制
    if (fs.existsSync(repoProjectPath)) {
      execSync(`rm -rf ${repoProjectPath}`, { stdio: 'pipe' });
    }
    execSync(`cp -r ${projectPath} ${repoProjectPath}`, { stdio: 'pipe' });

    // Git add 和 commit
    gitExec(`add projects/${projectName}/`);
    
    const agentName = {
      'product-manager': '产品经理',
      'engineering-full-stack-developer': '全栈工程师',
      'testing-senior-qa-engineer': '测试工程师'
    }[agentId] || agentId;

    const commitMsg = message || `feat(${projectName}): ${agentName} 产出提交`;
    const result = gitExec(`commit -m "${commitMsg}"`);
    
    console.log(`[DELIVERY] ${agentName} 提交产出: ${projectName}`);
    return { success: true, commit: commitMsg };
  },

  /**
   * CEO：验收并推送到远程仓库
   * @param {string} projectName - 项目名称
   */
  async deliver(projectName) {
    const status = getProjectStatus(projectName);
    
    if (!status.repo) {
      return { error: true, message: `项目 ${projectName} 未提交到仓库` };
    }

    console.log(`[DELIVERY] CEO 验收交付: ${projectName}`);

    // 检查是否有未提交的更改
    const pendingChanges = gitExec(`status --porcelain projects/${projectName}`);
    if (pendingChanges && pendingChanges.length > 0) {
      gitExec(`add projects/${projectName}/`);
      gitExec(`commit -m "feat(${projectName}): CEO 验收通过，准备交付"`);
    }

    // 推送到远程
    const pushResult = gitExec('push origin main');
    if (pushResult.error) {
      return { error: true, message: pushResult.message };
    }

    console.log(`[DELIVERY] 项目已推送到 GitHub: ${projectName}`);
    return { success: true, pushed: true };
  },

  /**
   * 查看所有项目状态
   */
  status() {
    const projects = listProjects();
    console.log('\n========================================');
    console.log('  项目交付状态');
    console.log('========================================');
    
    for (const p of projects) {
      const status = getProjectStatus(p.name);
      const icon = status.pushed ? '✅' : (status.committed ? '📦' : '📝');
      console.log(`${icon} ${p.name} - ${status.pushed ? '已推送' : (status.committed ? '已提交' : '待提交')}`);
    }
    
    return projects.map(p => getProjectStatus(p.name));
  },

  /**
   * 获取项目列表
   */
  listProjects,

  /**
   * 获取项目状态
   */
  getProjectStatus
};
