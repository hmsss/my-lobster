# MEMORY.md

保持 5KB 以内。只保留有复用价值的内容。

## 协作触发

```javascript
sessions_send({
  sessionKey: "agent:{目标agent}:feishu:group:{群id}",
  message: "@{触发词} {任务}",
  timeoutSeconds: 120
})
```

**触发词**：
- `@产品经理` → product-manager
- `@全栈工程师` → engineering-full-stack-developer
- `@测试` → testing-senior-qa-engineer
