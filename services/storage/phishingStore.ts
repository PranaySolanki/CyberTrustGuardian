type PhishingResult = {
    risk?: string;
    score?: number;
    reason?: string;
    content?: string;
}

type QuizContext = {
    content: string;
    type: string;
}

let lastResult: PhishingResult | null = null;
let quizContext: QuizContext | null = null;

export const setLastPhishingResult = (result: PhishingResult) => {
    lastResult = result;
};

export const getLastPhishingResult = () => {
    return lastResult;
};

export const clearLastPhishingResult = () => {
    lastResult = null;
};

export const setQuizContext = (context: QuizContext) => {
    quizContext = context;
};

export const getQuizContext = () => {
    return quizContext;
};

export const clearQuizContext = () => {
    quizContext = null;
};
