SQL (Dashboard SQL Editor)

- Hard delete all auth users and cascade to dependent auth tables:
```
truncate table auth.users cascade;
```
- Alternative hard delete without truncate:
```
delete from auth.users;
```
HTTP (Admin API via Bash)