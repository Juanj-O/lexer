import { useState } from "react";
import { Lexer } from "../lexer/lexer";
import { Token } from "../lexer/interfaces/token";
import "../App.css";

const App = () => {
  const [input, setInput] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<Token[]>([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleAnalyzeClick = () => {
    const lexer = new Lexer(input);
    const newTokens: Token[] = [];
    const errors: Token[] = [];
    let tokenList: Token[] | null;

    while ((tokenList = lexer.getNextToken()) !== null) {
      tokenList.forEach((token: Token) => {
        if (token.type == "ERROR") {
          errors.push(token);
        } else {
          newTokens.push(token);
        }
      });
    }

    setTokens(newTokens);
    setError(errors);
  };

  return (
    <div className="lexer-container">
      <textarea
        typeof="text"
        onChange={handleInputChange}
        maxLength={400}
        placeholder="Escribe lo que quieres analizar"
      />
      <button className="lexer-btn" onClick={handleAnalyzeClick}>
        Analizar
      </button>
      <div className="lexer-content">
        <div className="tokens">
          <h2>Tokens</h2>
          <ul>
            {tokens.map((token, index) => (
              <li key={index}>
                {token.type}: {token.value}
              </li>
            ))}
          </ul>
        </div>
        <div className="errors">
          <h2>Errores</h2>
          <ul>
            {error.map((error, index) => (
              <li key={index}>
                {error.type}: {error.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
