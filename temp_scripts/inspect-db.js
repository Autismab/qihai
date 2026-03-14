const Database = require('better-sqlite3');
const db = new Database('dev.db');
const tables = ['User', 'Profile', 'Preference', 'SurveyAnswer', 'SurveyQuestion', 'MatchBatch', 'Match'];
for (const t of tables) {
  try {
    const row = db.prepare(`select count(*) as c from "${t}"`).get();
    console.log(t, row.c);
  } catch (error) {
    console.log(t, error.message);
  }
}
console.log('---users---');
const rows = db.prepare(`
  select
    u.id,
    u.email,
    u.nickname,
    u.status,
    p.gender,
    p.birthYear,
    p.city,
    pr.targetGender,
    pr.relationshipGoal,
    pr.ageMin,
    pr.ageMax,
    pr.cityPreference,
    pr.weeklyActive,
    (select count(*) from "SurveyAnswer" sa where sa.userId = u.id) as answerCount
  from "User" u
  left join "Profile" p on p.userId = u.id
  left join "Preference" pr on pr.userId = u.id
  order by u.createdAt desc
  limit 20
`).all();
console.log(JSON.stringify(rows, null, 2));
