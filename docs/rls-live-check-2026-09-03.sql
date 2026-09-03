-- docs/rls-live-check-2026-09-03.sql
-- 只读巡检:粘进 Supabase SQL editor 跑,看 public.comments 的线上授权与策略现状。
-- 不改任何东西(三条都是 select),可反复跑。
--
-- 背景(2026-09-03 安全复核):harden_rls.sql 旧版给 authenticated 表级 SELECT,
-- 而列级遮蔽只做了 anon;配合 comments_select_public(to public, album_id <> 0),
-- 任何自注册账号都能 select=user_email 拉全体留言者邮箱。本次已把 authenticated
-- 也改成列级 SELECT(见 harden_rls.sql 第 5 节),线上是否已是这个状态用下面三条查。
--
-- "好"的结果长什么样(五条判据):
--   1. 第①条:grantee=authenticated 与 anon 都只出现 6 个 column_name
--      (id, album_id, content, user_id, user_nickname, created_at)的 SELECT 行,
--      绝不能有 column_name = user_email 且 privilege_type = SELECT 的行。
--   2. 第②条:authenticated 不能有 privilege_type = SELECT 的表级行
--      (表级 SELECT 会让第①条的列级限制形同虚设);INSERT/UPDATE/DELETE 表级保留是预期的。
--   3. 第②条:anon 只应出现列级(第①条)而不应有任何表级行;service_role / postgres
--      拥有全部权限是 Supabase 默认,忽略。
--   4. 第③条:任何 cmd = SELECT、roles 含 {public} 或 {authenticated}、qual 允许
--      album_id <> 0 的策略,只有在判据 1-2 成立时才是安全的;若判据 1-2 不成立,
--      这条策略就是泄露口,先补列级授权再谈策略。
--   5. 第③条:INSERT 策略的 with_check 里 moderation 拦截应是正则
--      `!~ '"kind"[[:space:]]*:[[:space:]]*"moderation"'`,而不是精确 LIKE
--      `not like '%"kind":"moderation"%'`(后者可用空格绕过)。
--
-- 注意:information_schema 视图只显示当前会话角色可见的授权;在 Supabase SQL editor
-- 默认以 postgres 超级角色运行,能看全。若结果为空,先确认当前角色。

-- ① 列级授权(谁能读/写哪些列)
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'comments'
order by 1, 2;

-- ② 表级授权(表级 SELECT 会覆盖列级限制)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'comments'
order by 1, 2;

-- ③ 行级策略(名字、角色、命令、USING、WITH CHECK)
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'comments'
order by cmd, policyname;
