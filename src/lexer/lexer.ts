import { Token } from "./interfaces/token";
import { TokenType } from "./types/tokenType";

export class Lexer {
  private position: number;
  private input: string;
  private nextStart: number | null;

  constructor(input: string) {
    this.position = 0;
    this.input = input;
    this.nextStart = null;
  }

  public getAllTokens(): Token[] {
    const tokens = [];
    let tokenList;
    while (true) {
      tokenList = this.getNextToken();
      if (tokenList === null) {
        break;
      } else {
        tokens.push(...tokenList);
      }
    }
    return tokens;
  }

  public getNextToken(): Token[] | null {
    this.position = this.nextStart !== null ? this.nextStart : this.position;
    this.nextStart = null;
    let char = this.getNextChar();
    const tokens: Token[] = [];

    // Ignorar los espacios en blanco
    while (char !== null && /\s/.test(char)) {
      this.position++;
      char = this.getNextChar();
    }

    if (char === null) return null;

    // Reconocer un número real
    if (char === "°") tokens.push(...this.isReal(char));
    // Reconocer un número entero
    else if (char === "#") tokens.push(...this.isNumber(char));
    // Reconocer un identificador
    else if (char === "@") tokens.push(...this.isIdentifier(char));
    // Reconocer palabras reservadas
    else if (/[A-Z]/.test(char)) tokens.push(...this.isKeyword(char));
    // Reconocer un operador relacional
    else if (["<", ">", "=", "!"].includes(char)) {
      return this.isRelationalOperator(char);
    }
    // Reconocer un operador de asignación
    else if (["+", "-", "*", "%", "/"].includes(char)) {
      return this.isAssignmentOperator(char);
    }
    // Reconocer si es decremento o incremento
    else if (char === "^") return this.isIncrementOrDecrementOperator();
    // Reconocer si es un operador logico
    else if (char === "¬" || char === "~") return this.isLogicalOperator(char);
    // Reconocer si es un paréntesis, llaver o corchetes
    else if (["(", ")", "{", "}", "[", "]"].includes(char)) {
      return this.isParenthesisOrBrace(char);
    }
    // Reconocer si es el fin de una sentencia
    else if (char === "¡") return this.isEndOfStatement(char);
    // Reconocer si es un separador
    else if (char === ",") return this.isSeparator(char);
    // Reconocer hexadecimales
    else if (char?.toUpperCase() === "H") return this.isHexadecimal(char);
    // Reconocer comentarios de bloque
    else if (char === ":") {
      return this.isBlockComment(char);
    }
    // Reconocer comentarios en línea
    // else if (char === ":") return this.isInlineComment(char);
    // Reconocer cadenas de caracteres
    else if (char === "$") return this.isCharacterString(char);
    // Reconocer los operadores
    else if (char !== null) {
      const operatorToken = this.isOperator(char);
      if (operatorToken) tokens.push(operatorToken);
    }

    // Error léxico
    else {
      this.position++;
      throw new Error(
        `Error léxico: Carácter inesperado '${char}' en la posición ${this.position}`
      );
    }

    return tokens;
  }

  private isReal(char: string | null): Token[] {
    let value: string = "";
    let count = 0;
    const tokens: Token[] = [];

    // Reconocer un número real
    if (char === "°") {
      this.position++;
      char = this.getNextChar();
      if (char === null || !/\d/.test(char)) {
        tokens.push({
          type: TokenType.ERROR,
          value: `Número real ${value} mal formado en la posición ${this.position}`,
        });
        return tokens;
      }
      while (char !== null && /\d/.test(char)) {
        if (count >= 10) {
          tokens.push({ type: TokenType.REAL, value });
          value = "";
          count = 0;
        }
        value += char;
        count++;
        this.position++;
        char = this.getNextChar();
      }

      if (char !== null && char === ".") {
        value += char;
        this.position++;
        char = this.getNextChar();
        if (char === null || !/\d/.test(char)) {
          tokens.push({
            type: TokenType.ERROR,
            value: `Número real ${value} mal formado en la posición ${this.position}`,
          });
          return tokens;
        }
        while (char !== null && /\d/.test(char)) {
          value += char;
          this.position++;
          char = this.getNextChar();
        }
      }
    }
    tokens.push({ type: TokenType.REAL, value });
    return tokens;
  }

  private isIdentifier(char: string | null): Token[] {
    let value = "";
    let count = 0;
    const tokens: Token[] = [];
    this.position++;
    char = this.getNextChar();
    if (char === null || !/[a-z]/i.test(char)) {
      tokens.push({
        type: TokenType.ERROR,
        value: `Identificador que empieza con ${char} mal formado en la posición ${this.position}`,
      });
      return tokens;
    }
    while (char !== null && /[a-z0-9]/i.test(char)) {
      if (count >= 10) {
        tokens.push({ type: TokenType.IDENTIFIER, value });
        value = "";
        count = 0;
      }
      value += char;
      count++;
      this.position++;
      char = this.getNextChar();
    }
    tokens.push({ type: TokenType.IDENTIFIER, value });
    return tokens;
  }

  private isNumber(char: string | null): Token[] {
    let value = "";
    let count = 0;
    const tokens: Token[] = [];
    this.position++;
    char = this.getNextChar();
    while (char !== null && /\d/.test(char)) {
      if (count >= 10) {
        tokens.push({ type: TokenType.INTEGER, value });
        value = "";
        count = 0;
      }
      value += char;
      count++;
      this.position++;
      char = this.getNextChar();
    }
    tokens.push({ type: TokenType.INTEGER, value });
    return tokens;
  }

  private isOperator(char: string | null): Token {
    this.position++;
    switch (char) {
      case "+":
        return { type: TokenType.PLUS, value: char };
      case "-":
        return { type: TokenType.MINUS, value: char };
      case "*":
        return { type: TokenType.MUL, value: char };
      case "/":
        return { type: TokenType.DIV, value: char };
      case "%":
        return { type: TokenType.MODULE, value: char };
      default:
        return { type: TokenType.ERROR, value: `Token no reconocido ${char}` };
    }
  }

  private isKeyword(char: string | null): Token[] {
    const keywords: any = {
      Ent: "Entero",
      Dec: "Real",
      Record: "For",
      When: "While",
      Lock: "Private",
      Open: "Public",
      Box: "Package",
      Obtain: "Import",
      Group: "Class",
      Send: "Return",
      Close: "Break",
    };
    const tokens: Token[] = [];
    let value = "";
    let count = 0;

    while (char !== null && /[a-zA-Z0-9]/.test(char)) {
      value += char;
      this.position++;
      char = this.getNextChar();
      count++;

      // Divide el token si excede los 10 caracteres
      if (count >= 10) {
        if (value in keywords) {
          tokens.push({
            type: TokenType.RESERVED_WORD,
            value: `${value} = ${keywords[value]}`,
          });
        }
        value = "";
        count = 0;
      }
    }

    // Asegurarse de que el último token se añade
    if (value.length > 0) {
      if (value in keywords) {
        tokens.push({
          type: TokenType.RESERVED_WORD,
          value: `${value} = ${keywords[value]}`,
        });
      }
    }

    return tokens;
  }

  private isRelationalOperator(char: string | null): Token[] {
    let value = "";
    this.position++;
    const nextChar = this.getNextChar();
    if (nextChar === "=") {
      value = char + nextChar;
      this.position++;
    } else {
      value += char;
      return this.isEndOfStatement(char);
    }
    return [{ type: TokenType.RELATIONAL_OPERATOR, value }];
  }

  private isAssignmentOperator(char: string | null): Token[] {
    this.position++;
    let nextChar = this.getNextChar();
    const tokens: Token[] = [];
    if (nextChar === "=") {
      tokens.push({
        type: TokenType.ASSIGNMENT_OPERATOR,
        value: char + nextChar,
      });
      this.position++;
    } else {
      tokens.push(this.isOperator(char));
    }
    return tokens;
  }

  private isIncrementOrDecrementOperator(): Token[] {
    this.position++;
    let nextChar1 = this.getNextChar();
    this.position++;
    let nextChar2 = this.getNextChar();

    const tokens: Token[] = [];
    if (nextChar1 === "+" && nextChar2 === "+") {
      tokens.push({
        type: TokenType.INCREMENT_OPERATOR,
        value: "^" + nextChar1 + nextChar2,
      });
      this.position++;
    } else if (nextChar1 === "-" && nextChar2 === "-") {
      tokens.push({
        type: TokenType.INCREMENT_OPERATOR,
        value: "^" + nextChar1 + nextChar2,
      });
      this.position++;
    } else {
      tokens.push({
        type: TokenType.ERROR,
        value: `Operador de incremento/decremento ^${nextChar1}${nextChar2} mal formado en la posición ${this.position}`,
      });
    }
    return tokens;
  }

  private isLogicalOperator(char: string | null): Token[] {
    const tokens: Token[] = [];
    if (char === "¬" || char === "~") {
      tokens.push({ type: TokenType.LOGICAL_OPERATOR, value: char });
      this.position++;
    }
    return tokens;
  }

  private isParenthesisOrBrace(char: string): Token[] {
    const tokens: Token[] = [];
    if (["(", ")", "{", "}", "[", "]"].includes(char)) {
      let type: string;
      switch (char) {
        case "(":
          type = TokenType.PARENTHESIS_OPENING;
          break;
        case ")":
          type = TokenType.PARENTHESIS_CLOSING;
          break;
        case "{":
          type = TokenType.KEY_OPENING;
          break;
        case "}":
          type = TokenType.KEY_CLOSING;
          break;
        case "[":
          type = TokenType.BRACKET_OPENING;
          break;
        case "]":
          type = TokenType.BRACKET_CLOSING;
          break;
        default:
          type = TokenType.ERROR;
          break;
      }
      tokens.push({ type, value: char });
      this.position++;
    }
    return tokens;
  }

  private isEndOfStatement(char: string | null): Token[] {
    const tokens: Token[] = [];
    if (char === "¡") {
      tokens.push({ type: TokenType.END_OF_STATEMENT, value: char });
      this.position++;
    }
    return tokens;
  }

  private isSeparator(char: string | null): Token[] {
    const tokens: Token[] = [];
    if (char === ",") {
      tokens.push({ type: TokenType.SEPARATOR, value: char });
      this.position++;
    }
    return tokens;
  }

  private isHexadecimal(char: string | null): Token[] {
    const tokens: Token[] = [];
    let value = "";

    if (char?.toUpperCase() === "H") {
      this.position++;
      char = this.getNextChar();

      while (char !== null && /[0-9A-F]/i.test(char)) {
        value += char;
        this.position++;
        char = this.getNextChar();
      }

      if (value) {
        tokens.push({ type: TokenType.HEXADECIMAL, value: "H" + value });
      } else {
        tokens.push({
          type: TokenType.ERROR,
          value: `Hexadecimal mal formado en la posición ${this.position}`,
        });
      }
    }

    return tokens;
  }

  private isInlineComment(char: string | null): Token[] {
    const tokens: Token[] = [];
    let value = "";
    if (char !== null) {
      this.position++;
      char = this.getNextChar();

      while (char !== null && char !== "\n") {
        value += char;
        this.position++;
        char = this.getNextChar();
      }

      tokens.push({ type: TokenType.INLINE_COMMENT, value: ":" + value });
    }

    return tokens;
  }

  private isBlockComment(char: string | null): Token[] {
    let value: string = "";
    const tokens: Token[] = [];
    if (char === ":") {
      this.position++;
      char = this.getNextChar();
      if (char === "/") {
        this.position++;
        char = this.getNextChar();
        while (char !== null) {
          if (char === "/") {
            this.position++;
            let nextChar = this.getNextChar();
            if (nextChar === ":") {
              break;
            }
          }
          value += char;
          this.position++;
          char = this.getNextChar();
        }
        tokens.push({
          type: TokenType.BLOCK_COMMENT,
          value: ":/" + value + "/:",
        });
      } else if (char !== null) {
        return this.isInlineComment(char);
      }
    }
    if (char !== "/") {
      this.position++;
      let nextChar = this.getNextChar();
      if (nextChar !== ":") {
      }
    }

    return tokens;
  }

  private isCharacterString(char: string | null): Token[] {
    const tokens: Token[] = [];
    let value = "";

    if (char === "$") {
      this.position++;
      char = this.getNextChar();

      while (char !== null && char !== "$") {
        value += char;
        this.position++;
        char = this.getNextChar();
      }

      if (char !== null) {
        this.position++; // Skip $
        tokens.push({
          type: TokenType.CHARACTER_STRINGS,
          value: "$" + value + "$",
        });
      } else {
        tokens.push({
          type: TokenType.ERROR,
          value: `Cadena no terminada en la posición ${this.position}`,
        });
      }
    }

    return tokens;
  }

  private getNextChar(): string | null {
    if (this.position >= this.input.length) {
      return null;
    } else {
      return this.input[this.position];
    }
  }
}
