import { Token } from "./interfaces/token";

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
          type: "ERROR",
          value: `Número real ${value} mal formado en la posición ${this.position}`,
        });
        return tokens;
      }
      while (char !== null && /\d/.test(char)) {
        if (count >= 10) {
          tokens.push({ type: "REAL", value });
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
            type: "ERROR",
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
    tokens.push({ type: "REAL", value });
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
        type: "ERROR",
        value: `Identificador que empieza con ${char} mal formado en la posición ${this.position}`,
      });
      return tokens;
    }
    while (char !== null && /[a-z0-9]/i.test(char)) {
      if (count >= 10) {
        tokens.push({ type: "IDENTIFIER", value });
        value = "";
        count = 0;
      }
      value += char;
      count++;
      this.position++;
      char = this.getNextChar();
    }
    tokens.push({ type: "IDENTIFIER", value });
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
        tokens.push({ type: "INTEGER", value });
        value = "";
        count = 0;
      }
      value += char;
      count++;
      this.position++;
      char = this.getNextChar();
    }
    tokens.push({ type: "INTEGER", value });
    return tokens;
  }

  private isOperator(char: string | null): Token | null {
    this.position++;
    switch (char) {
      case "+":
        return { type: "PLUS", value: char };
      case "-":
        return { type: "MINUS", value: char };
      case "*":
        return { type: "MUL", value: char };
      case "/":
        return { type: "DIV", value: char };
      case "%":
        return { type: "MODULE", value: char };
      default:
        return { type: "ERROR", value: `Token no reconocido ${char}` };
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
            type: "RESERVED_WORD",
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
          type: "RESERVED_WORD",
          value: `${value} = ${keywords[value]}`,
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
