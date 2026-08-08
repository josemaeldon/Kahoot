import Head from "next/head";
import Header from "@components/Header";
import styles from "@styles/public.module.css";

export default function PrivacyPolicy() {
  return (
    <main className={styles.page}>
      <Head>
        <title>Política de privacidade | Play!</title>
        <meta name="description" content="Política de privacidade do Play!." />
      </Head>
      <Header />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Transparência</p>
        <h1>Política de privacidade</h1>
        <p className={styles.intro}>
          Esta política explica como o Play! coleta, usa, armazena e protege as informações de seus usuários.
        </p>
        <p className={styles.updated}>Última atualização: 8 de agosto de 2026</p>
        <section>
          <h2>1. Informações que coletamos</h2>
          <ul>
            <li><strong>Conta:</strong> nome de usuário, nome completo, e-mail e senha protegida por criptografia.</li>
            <li><strong>Partidas:</strong> Plays!, perguntas, respostas, nomes de jogadores, pontuações e identificadores das salas.</li>
            <li><strong>Uso técnico:</strong> informações necessárias para autenticação, segurança, funcionamento da sessão e diagnóstico de erros.</li>
          </ul>
        </section>
        <section>
          <h2>2. Como usamos as informações</h2>
          <p>Usamos essas informações para criar e manter sua conta, permitir partidas ao vivo, salvar seu conteúdo, prestar suporte, enviar comunicações necessárias e proteger o serviço contra uso indevido. Não vendemos informações pessoais.</p>
        </section>
        <section>
          <h2>3. Compartilhamento e serviços de terceiros</h2>
          <p>Podemos compartilhar dados apenas quando necessário para operar o serviço, cumprir a lei ou proteger direitos. Serviços de pagamento, e-mail, hospedagem e infraestrutura podem processar dados sob suas próprias políticas de privacidade e com medidas de segurança apropriadas.</p>
        </section>
        <section>
          <h2>4. Armazenamento e segurança</h2>
          <p>Adotamos medidas técnicas e administrativas para proteger as informações contra acesso, alteração ou divulgação não autorizados. Nenhum serviço online é completamente livre de riscos; por isso, mantenha suas credenciais em sigilo.</p>
        </section>
        <section>
          <h2>5. Seus direitos</h2>
          <p>Você pode solicitar acesso, correção ou exclusão dos dados associados à sua conta. Para isso, envie um pedido para <a href="mailto:admin@cloudbr.app">admin@cloudbr.app</a>. Podemos pedir informações para confirmar a titularidade da conta.</p>
        </section>
        <section>
          <h2>6. Crianças e alterações</h2>
          <p>O Play! não é direcionado a crianças sem a supervisão de um responsável. Podemos atualizar esta política para refletir mudanças no serviço ou na legislação; a data no topo indica a versão vigente.</p>
        </section>
        <section>
          <h2>7. Contato</h2>
          <p>Em caso de dúvidas sobre privacidade, entre em contato pelo e-mail <a href="mailto:admin@cloudbr.app">admin@cloudbr.app</a>.</p>
        </section>
      </div>
    </main>
  );
}
