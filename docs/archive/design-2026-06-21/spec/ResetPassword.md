# 重设密码 ResetPassword —— 深度规格

> 真实文件:`src/pages/ResetPassword.jsx` · 路由 `/reset-password`

## 为什么有这一页

登录页的「找回密码」tab 只是**发**重置邮件。用户点开邮件里的链接,落到的就是**这一页** —— 设置新密码的地方。没有它,找回密码流程是断的。

## 结构(居中)

1. 顶部页头(只字标)。
2. 报头:眼标「Réinitialisation」→ h1「设置新密码」→ summary。
3. **表单态**:新密码 · Nouveau mot de passe / 确认新密码 · Confirmer(细下划线、居中)+ 强度提示 + 「保存新密码 · Enregistrer」+ 法语冥想尾句(配中文)。
4. **成功态**:绿 ✓「已更新」+ 「前往登录 →」。
5. **链接失效态**:暗红「链接已失效」+「重新申请 · 找回密码 →」。

## 关键细节

- 三态对应真实场景:有效链接→表单;提交成功→成功态;链接过期/已用→失效态(Supabase 的 recovery token 会过期)。
- 文案 `中文 · Français`,零英文。
- 输入框细下划线 + 居中,和 Login 同款。
- 真实化:接 Supabase `updateUser({password})`;校验两次密码一致 + 长度≥8;校验 URL 里的 recovery token 是否有效(无效→失效态)。

## 易错点

- ❌ 漏掉「链接失效」态 → token 会过期,必须有。
- ❌ 方框输入框 → 细下划线。
- ❌ 英文标签 → 中文·法语。
