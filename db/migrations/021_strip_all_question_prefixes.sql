-- Remove every metadata prefix produced by the earlier public-seed
-- migrations, leaving only the direct question text.
update questions q
set question_text = case
  when q.question_text ~ '^Edição [0-9]{2} de .*? — pergunta [0-9]+: ' then
    regexp_replace(q.question_text, '^Edição [0-9]{2} de .*? — pergunta [0-9]+: ', '')
  when q.question_text ~ '^Na edição .*?, qual alternativa responde corretamente\? ' then
    regexp_replace(q.question_text, '^Na edição .*?, qual alternativa responde corretamente\? ', '')
  when q.question_text ~ '^Desafio .*? — escolha a resposta certa para: ' then
    regexp_replace(q.question_text, '^Desafio .*? — escolha a resposta certa para: ', '')
  when q.question_text ~ '^Em uma revisão de .*?, edição [0-9]{2}: ' then
    regexp_replace(q.question_text, '^Em uma revisão de .*?, edição [0-9]{2}: ', '')
  when q.question_text ~ '^Questão [0-9]+ da edição [0-9]{2} de .*?: ' then
    regexp_replace(q.question_text, '^Questão [0-9]+ da edição [0-9]{2} de .*?: ', '')
  when q.question_text ~ '^Teste de .*? — edição [0-9]{2}: responda à pergunta: ' then
    regexp_replace(q.question_text, '^Teste de .*? — edição [0-9]{2}: responda à pergunta: ', '')
  else q.question_text
end
from games g
where g.id = q.game_id
  and g.is_public = true;
