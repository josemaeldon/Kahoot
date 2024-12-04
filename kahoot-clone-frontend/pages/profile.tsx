import Questions from "@components/Questions";
import Header from "@components/Header";
import styles from "@styles/profile.module.css";
import React, { useEffect, useState } from "react";
import useUser from "@lib/useSSRUser";
import type { db } from "../kahoot";
import { postData } from "@lib/postData";
import {
  APIRequest as GetGameReq,
  APIResponse as GetGameRes,
} from "./api/getGames";
import { TiDelete, TiEdit } from "react-icons/ti";
import { useRouter } from "next/router";
import { APIRequest, APIResponse } from "./api/deleteOneGame";
import { BsTrash } from "react-icons/bs";

function Profile() {
  const { loggedIn, user } = useUser();
  const [data, setData] = useState<null | db.KahootGame[]>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortByMonth, setSortByMonth] = useState(false); // Estado para ordenar por mês
  const [filteredData, setFilteredData] = useState<db.KahootGame[]>([]); // Para armazenar dados filtrados
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Filtro por categoria

  function getSetUserData() {
    postData<GetGameReq, GetGameRes>("/api/getGames", {
      type: "userId",
      userId: user._id,
    }).then((res) => {
      if (res.error === true) {
        //Todo: error gui
      } else {
        setData(res.games);
        setFilteredData(res.games);
        console.log(res.games);
      }
    });
  }

  useEffect(() => {
    if (loggedIn) {
      getSetUserData();
    }
  }, [loggedIn]);

  const router = useRouter();
  if (!loggedIn) return <></>;

  // Função para ordenar por data ou por mês
  const sortedData = filteredData
    ? [...filteredData].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        if (sortByMonth) {
          // Ordenação por mês (comparar ano e mês)
          const monthA = new Date(a.date).getMonth();
          const monthB = new Date(b.date).getMonth();
          return sortOrder === "asc" ? monthA - monthB : monthB - monthA;
        } else {
          // Ordenação por data
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
      })
    : [];

  // Função para formatar o mês de forma legível
  const formatMonth = (date: number) => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return months[new Date(date).getMonth()];
  };

  // Função para filtrar os jogos por mês
  const handleMonthFilter = (month: string) => {
    if (!month) {
      setFilteredData(data); // Se não houver filtro, exibe todos
    } else {
      setFilteredData(
        data.filter((game) => formatMonth(game.date) === month)
      );
    }
  };

  // Função para filtrar por categoria
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === "") {
      setFilteredData(data); // Se não houver filtro, exibe todos
    } else {
      setFilteredData(
        data.filter((game) => game.category === category)
      );
    }
  };

  return (
    <div className={`${styles.container}`}>
      <div className={`${styles.otherContainer}`}>
        <Header></Header>
      </div>
      <div className={`${styles.innerContainer}`}>
        <div className={`${styles.innerInnerContainer}`}>
          <div className={`${styles.flexContainer}`}>
            <p className={`${styles.headerMessage}`}>Meus Kahoots:</p>
            {data !== null && data.length !== 0 && (
              <>
                <button
                  className={`${styles.playButton}`}
                  onClick={() => router.push("/create")}
                >
                  Criar Kahoot
                </button>
                <button
                  className={`${styles.sortButton}`}
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  Ordenar por data ({sortOrder === "asc" ? "Crescente" : "Decrescente"})
                </button>
                <button
                  className={`${styles.sortButton}`}
                  onClick={() => setSortByMonth(!sortByMonth)}
                >
                  Ordenar por mês ({sortByMonth ? "Ano" : "Mês"})
                </button>
                <div>
                  <label>Filtrar por mês:</label>
                  <select onChange={(e) => handleMonthFilter(e.target.value)} defaultValue="">
                    <option value="">Todos</option>
                    <option value="Janeiro">Janeiro</option>
                    <option value="Fevereiro">Fevereiro</option>
                    <option value="Março">Março</option>
                    <option value="Abril">Abril</option>
                    <option value="Maio">Maio</option>
                    <option value="Junho">Junho</option>
                    <option value="Julho">Julho</option>
                    <option value="Agosto">Agosto</option>
                    <option value="Setembro">Setembro</option>
                    <option value="Outubro">Outubro</option>
                    <option value="Novembro">Novembro</option>
                    <option value="Dezembro">Dezembro</option>
                  </select>
                </div>

                <div>
                  <label>Filtrar por categoria:</label>
                  <select onChange={(e) => handleCategoryFilter(e.target.value)} value={selectedCategory}>
                    <option value="">Todas</option>
                    <option value="Categoria 1">Categoria 1</option>
                    <option value="Categoria 2">Categoria 2</option>
                    <option value="Categoria 3">Categoria 3</option>
                    {/* Adicione mais categorias conforme necessário */}
                  </select>
                </div>
              </>
            )}
          </div>

          {data !== null && data.length === 0 && (
            <div className={`${styles.emptyMessage}`}>
              <p>Parece que você não tem Kahoots :(</p>
              <button
                className={`${styles.playButton}`}
                onClick={() => router.push("/create")}
              >
                Crie um
              </button>
            </div>
          )}

          <div className={`${styles.kahootGrid}`}>
            {sortedData.map((game) => {
              const date = new Date();
              date.setTime(game.date);
              const month = formatMonth(game.date); // Mês formatado

              return (
                <div className={`${styles.gameElement}`} key={game._id}>
                  <p>
                    <b>{game.title}</b>
                  </p>
                  <p>
                    {game.questions.length}{" "}
                    {game.questions.length === 1 ? "Pergunta" : "Perguntas"}
                  </p>
                  <p>{`Criado: ${date.toLocaleDateString()}`}</p>
                  <p>{`Mês: ${month}`}</p> {/* Exibindo o mês */}
                  <p className={`${styles.category}`}>{game.category}</p> {/* Exibindo a categoria */}
                  <button
                    className={`${styles.playButton}`}
                    onClick={() => {
                      router.push({
                        pathname: "/host",
                        query: { gameId: game._id },
                      });
                    }}
                  >
                    Começar
                  </button>
                  <div
                    className={`${styles.edit}`}
                    onClick={() => {
                      router.push({
                        pathname: "/create",
                        query: { editingId: game._id },
                      });
                    }}
                  >
                    <TiEdit></TiEdit>
                  </div>
                  <div
                    className={`${styles.delete}`}
                    onClick={() => {
                      postData<APIRequest, APIResponse>(
                        "/api/deleteOneGame",
                        { gameId: game._id }
                      ).then((res) => {
                        if (res.error === false) {
                          getSetUserData();
                        }
                      });
                    }}
                  >
                    <BsTrash />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
