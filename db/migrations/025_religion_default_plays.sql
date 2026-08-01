-- Adiciona a categoria Religião e seus jogos padrão sem alterar a migração 007 já aplicada.

alter table questions
  alter column time_seconds set default 15;

update questions
set time_seconds = 15
where time_seconds <> 15;

insert into categories (name, slug, is_default)
values ('Religião', 'religiao', true)
on conflict (slug) do update
set name = excluded.name,
    is_default = true;

do $$
declare
  catalog jsonb := $catalog$
[
    {
      "slug": "religiao",
      "questions": [
        [
          "Qual é o livro sagrado central do cristianismo?",
          "Bíblia",
          [
            "Mateus",
            "João",
            "Gênesis"
          ]
        ],
        [
          "Como se chama o mês de jejum no islamismo?",
          "Ramadã",
          [
            "Apocalipse",
            "João",
            "Mateus"
          ]
        ],
        [
          "Qual cidade é sagrada para judeus, cristãos e muçulmanos?",
          "Jerusalém",
          [
            "Belém",
            "Vaticano",
            "Nazaré"
          ]
        ],
        [
          "Em qual país o budismo surgiu?",
          "Índia",
          [
            "João",
            "Mateus",
            "Isaías"
          ]
        ],
        [
          "Qual é o principal dia semanal de descanso e culto no judaísmo?",
          "Shabat",
          [
            "Atos dos Apóstolos",
            "Jonas",
            "Gênesis"
          ]
        ],
        [
          "Quem é tradicionalmente associado à fundação do budismo?",
          "Siddhartha Gautama",
          [
            "Paulo",
            "Davi",
            "Noé"
          ]
        ],
        [
          "Qual celebração cristã recorda a ressurreição de Jesus?",
          "Páscoa",
          [
            "Quaresma",
            "Natal",
            "Epifania"
          ]
        ],
        [
          "Como é chamado um local de culto islâmico?",
          "Mesquita",
          [
            "Roma",
            "Jerusalém",
            "Belém"
          ]
        ],
        [
          "Qual tradição religiosa tem os Vedas entre seus textos antigos?",
          "Hinduísmo",
          [
            "Islamismo",
            "Judaísmo",
            "Budismo"
          ]
        ],
        [
          "O diálogo respeitoso entre diferentes religiões é chamado de quê?",
          "Diálogo inter-religioso",
          [
            "João",
            "Êxodo",
            "Mateus"
          ]
        ],
        [
          "Quantos livros compõem a Bíblia Católica?",
          "73",
          [
            "66",
            "72",
            "75"
          ]
        ],
        [
          "Quantos livros possui o Novo Testamento?",
          "27",
          [
            "24",
            "39",
            "46"
          ]
        ],
        [
          "Qual é o primeiro livro da Bíblia?",
          "Gênesis",
          [
            "João",
            "Êxodo",
            "Mateus"
          ]
        ],
        [
          "Qual é o último livro da Bíblia?",
          "Apocalipse",
          [
            "Salmos",
            "Jonas",
            "Isaías"
          ]
        ],
        [
          "Quem construiu a arca segundo o Gênesis?",
          "Noé",
          [
            "Maria",
            "Pedro",
            "Paulo"
          ]
        ],
        [
          "Quem recebeu os Dez Mandamentos no Sinai?",
          "Moisés",
          [
            "Judas Iscariotes",
            "Maria",
            "Pedro"
          ]
        ],
        [
          "Quem derrotou Golias?",
          "Davi",
          [
            "Moisés",
            "Maria",
            "Paulo"
          ]
        ],
        [
          "Quem foi lançado na cova dos leões?",
          "Daniel",
          [
            "Pedro",
            "Davi",
            "Moisés"
          ]
        ],
        [
          "Qual profeta foi engolido por um grande peixe?",
          "Jonas",
          [
            "Atos dos Apóstolos",
            "Gênesis",
            "Isaías"
          ]
        ],
        [
          "Quem foi a mãe de Jesus?",
          "Maria",
          [
            "Judas Iscariotes",
            "Pedro",
            "Paulo"
          ]
        ],
        [
          "Em qual cidade Jesus nasceu?",
          "Belém",
          [
            "Meca",
            "Jerusalém",
            "Vaticano"
          ]
        ],
        [
          "Em qual cidade Jesus cresceu?",
          "Nazaré",
          [
            "Roma",
            "Belém",
            "Meca"
          ]
        ],
        [
          "Quem batizou Jesus no rio Jordão?",
          "João Batista",
          [
            "Davi",
            "Moisés",
            "Abraão"
          ]
        ],
        [
          "Quantos apóstolos Jesus escolheu?",
          "12",
          [
            "Mateus",
            "Salmos",
            "Daniel"
          ]
        ],
        [
          "Quem negou Jesus três vezes?",
          "Pedro",
          [
            "Maria",
            "Judas Iscariotes",
            "Davi"
          ]
        ],
        [
          "Quem traiu Jesus?",
          "Judas Iscariotes",
          [
            "Pedro",
            "Paulo",
            "Moisés"
          ]
        ],
        [
          "Qual apóstolo era cobrador de impostos?",
          "Mateus",
          [
            "João",
            "Jonas",
            "Apocalipse"
          ]
        ],
        [
          "Qual apóstolo ficou conhecido como o discípulo amado?",
          "João",
          [
            "Isaías",
            "Daniel",
            "Apocalipse"
          ]
        ],
        [
          "Qual acontecimento é celebrado em Pentecostes?",
          "Descida do Espírito Santo",
          [
            "Mateus",
            "Gênesis",
            "João"
          ]
        ],
        [
          "Qual sacramento apaga o pecado original e inicia a vida cristã?",
          "Batismo",
          [
            "Matrimônio",
            "Confirmação",
            "Eucaristia"
          ]
        ],
        [
          "Qual sacramento fortalece com o dom do Espírito Santo?",
          "Crisma",
          [
            "Confirmação",
            "Batismo",
            "Matrimônio"
          ]
        ],
        [
          "Qual sacramento torna presente o Corpo e Sangue de Cristo?",
          "Eucaristia",
          [
            "Unção dos Enfermos",
            "Matrimônio",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento concede o perdão dos pecados após o Batismo?",
          "Reconciliação",
          [
            "Eucaristia",
            "Matrimônio",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento une um homem e uma mulher em aliança matrimonial?",
          "Matrimônio",
          [
            "Batismo",
            "Reconciliação",
            "Confirmação"
          ]
        ],
        [
          "Qual sacramento configura ministros ao serviço da Igreja?",
          "Ordem",
          [
            "Reconciliação",
            "Confirmação",
            "Batismo"
          ]
        ],
        [
          "Qual sacramento oferece graça especial aos enfermos?",
          "Unção dos Enfermos",
          [
            "Confirmação",
            "Ordem",
            "Reconciliação"
          ]
        ],
        [
          "Quantos sacramentos existem na Igreja Católica?",
          "7",
          [
            "Matrimônio",
            "Confirmação",
            "Unção dos Enfermos"
          ]
        ],
        [
          "Qual é o primeiro tempo do ano litúrgico?",
          "Advento",
          [
            "Pentecostes",
            "Páscoa",
            "Quaresma"
          ]
        ],
        [
          "Qual cor litúrgica é usada normalmente no Tempo Comum?",
          "Verde",
          [
            "Êxodo",
            "Atos dos Apóstolos",
            "João"
          ]
        ],
        [
          "Qual cor litúrgica é usada normalmente no Advento e na Quaresma?",
          "Roxo",
          [
            "Salmos",
            "Jonas",
            "Mateus"
          ]
        ],
        [
          "Qual dia inicia a Quaresma?",
          "Quarta-feira de Cinzas",
          [
            "Apocalipse",
            "Daniel",
            "Isaías"
          ]
        ],
        [
          "Qual celebração recorda a instituição da Eucaristia?",
          "Quinta-feira Santa",
          [
            "Quaresma",
            "Epifania",
            "Páscoa"
          ]
        ],
        [
          "Qual dia recorda a Paixão e Morte de Jesus?",
          "Sexta-feira Santa",
          [
            "Êxodo",
            "Gênesis",
            "João"
          ]
        ],
        [
          "Qual oração Jesus ensinou aos discípulos?",
          "Pai-Nosso",
          [
            "Apocalipse",
            "Gênesis",
            "Isaías"
          ]
        ],
        [
          "Qual oração mariana começa com “Ave, Maria, cheia de graça”?",
          "Ave-Maria",
          [
            "Mateus",
            "João",
            "Daniel"
          ]
        ],
        [
          "Quem é o sucessor de São Pedro na Igreja Católica?",
          "Papa",
          [
            "Moisés",
            "João Batista",
            "Pedro"
          ]
        ],
        [
          "Qual cidade-Estado é sede da Igreja Católica?",
          "Vaticano",
          [
            "Roma",
            "Jerusalém",
            "Nazaré"
          ]
        ],
        [
          "Qual santo é conhecido como padroeiro dos animais e da ecologia?",
          "São Francisco de Assis",
          [
            "Apocalipse",
            "Êxodo",
            "João"
          ]
        ],
        [
          "Qual santa é conhecida como a pequena flor?",
          "Santa Teresinha do Menino Jesus",
          [
            "Isaías",
            "Mateus",
            "Daniel"
          ]
        ],
        [
          "Qual documento reúne de forma sistemática a doutrina católica?",
          "Catecismo da Igreja Católica",
          [
            "Atos dos Apóstolos",
            "Mateus",
            "João"
          ]
        ]
      ]
    }
]
$catalog$::jsonb;
  category_record jsonb;
  question_record jsonb;
  category_uuid uuid;
  game_uuid uuid;
  question_uuid bigint;
  edition integer;
  question_position integer;
  correct_position integer;
  choice_position integer;
  wrong_index integer;
  answer_text text;
  seed text;
begin
  for category_record in select value from jsonb_array_elements(catalog)
  loop
    select id into category_uuid from categories where slug = category_record->>'slug';
    for edition in 1..50
    loop
      seed := (category_record->>'slug') || '-' || lpad(edition::text, 2, '0');
      insert into games (author_id, category_id, title, is_public, is_default, seed_key, published_at, created_at, updated_at)
      values (
        '00000000-0000-4000-8000-000000000001'::uuid,
        category_uuid,
        (select name from categories where id = category_uuid) || ' — Desafio ' || lpad(edition::text, 2, '0'),
        true, true, seed,
        now() - make_interval(mins => (1001 - edition)),
        now() - make_interval(mins => (1001 - edition)),
        now() - make_interval(mins => (1001 - edition))
      )
      on conflict (seed_key) where seed_key is not null do nothing
      returning id into game_uuid;
      if game_uuid is null then continue; end if;
      question_position := 0;
      for question_record in select value from jsonb_array_elements(category_record->'questions')
      loop
        correct_position := (edition + question_position) % 4;
        insert into questions (game_id, position, question_text, correct_answer, time_seconds)
        values (game_uuid, question_position, question_record->>0, correct_position, 15)
        returning id into question_uuid;
        wrong_index := 0;
        for choice_position in 0..3
        loop
          if choice_position = correct_position then
            answer_text := question_record->>1;
          else
            answer_text := question_record->2->>wrong_index;
            wrong_index := wrong_index + 1;
          end if;
          insert into choices (question_id, position, choice_text)
          values (question_uuid, choice_position, answer_text);
        end loop;
        question_position := question_position + 1;
      end loop;
    end loop;
  end loop;
end
$$;
