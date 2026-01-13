import { generateCyberIQQuiz } from '@/services/calls/gemini';
import { clearQuizContext, getQuizContext } from '@/services/storage/phishingStore';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QuizPage() {
    const [quiz, setQuiz] = useState<{ question: string; options: string[]; correctAnswerIndex: number; explanation: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        const context = getQuizContext();
        if (!context) {
            setError("No quiz context found.");
            setLoading(false);
            return;
        }

        try {
            const quizData = await generateCyberIQQuiz(context.content, context.type);
            setQuiz(quizData);
        } catch (e) {
            setError("Failed to generate quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        setSelectedOption(index);
        setShowExplanation(true);
    };

    const handleGoHome = () => {
        clearQuizContext();
        router.dismissTo('/pages/phishing/phishing');
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Generating your daily challenge...</Text>
            </View>
        );
    }

    if (error || !quiz) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || "Something went wrong"}</Text>
                <TouchableOpacity style={styles.button} onPress={handleGoHome}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Cyber IQ Challenge</Text>
            <Text style={styles.subtext}>Test your knowledge based on your recent scan!</Text>

            <View style={styles.card}>
                <Text style={styles.question}>{quiz.question}</Text>

                {quiz.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = index === quiz.correctAnswerIndex;
                    let optionStyle = styles.optionButton;

                    if (showExplanation) {
                        if (isCorrect) optionStyle = { ...styles.optionButton, ...styles.optionCorrect };
                        else if (isSelected) optionStyle = { ...styles.optionButton, ...styles.optionWrong };
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={optionStyle}
                            onPress={() => !showExplanation && handleOptionSelect(index)}
                            disabled={showExplanation}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                            {showExplanation && isCorrect && <Text style={styles.icon}>✅</Text>}
                            {showExplanation && isSelected && !isCorrect && <Text style={styles.icon}>❌</Text>}
                        </TouchableOpacity>
                    )
                })}

                {showExplanation && (
                    <View style={styles.explanationBox}>
                        <Text style={styles.explanationTitle}>{selectedOption === quiz.correctAnswerIndex ? "Correct!" : "Incorrect"}</Text>
                        <Text style={styles.explanationText}>{quiz.explanation}</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.button} onPress={handleGoHome}>
                <Text style={styles.buttonText}>{showExplanation ? "Finish" : "Skip"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 16 },
    header: { fontSize: 28, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
    subtext: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 30 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    question: { fontSize: 18, fontWeight: '600', color: '#0F172A', marginBottom: 20, lineHeight: 26 },

    optionButton: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionText: { color: '#334155', fontSize: 15, flex: 1, fontWeight: '500' },
    optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
    optionWrong: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
    icon: { marginLeft: 10 },

    explanationBox: { marginTop: 20, padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    explanationTitle: { fontWeight: '700', marginBottom: 6, color: '#1E40AF', fontSize: 16 },
    explanationText: { color: '#1E3A8A', fontSize: 14, lineHeight: 20 },

    button: { marginTop: 30, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', width: '100%' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    errorText: { color: '#EF4444', fontSize: 16, marginBottom: 20 }
});
