"use client"

import { useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import QuestionItem from "@/app/Components/question-item"
import ProgressBar from "@/app/Components/progress-bar"
import ResultScreen from "@/app/Components/result-screen"
import WelcomeScreen from "@/app/Components/welcome-screen"

const questions = [
  { id: 1, text: "What is your gender?", options: ["Male", "Female", "Others"] },
  { id: 2, text: "What is your age?", options: ["17-25", "26-35", "36-45", "46-55"] },
  { id: 3, text: "Academic pressure on a scale of 0-5?", options: ["0", "1", "2", "3", "4", "5"] },
  { id: 4, text: "Study Satisfaction (1-10)", type: "scale" },
  { id: 5, text: "Sleep duration", options: ["less than 5 hrs", "5-6 hrs", "7-8 hrs", "more than 8"] },
  { id: 6, text: "Dietary habits", options: ["healthy", "moderate", "unhealthy"] },
  { id: 7, text: "Have you ever had suicidal thoughts?", options: ["Yes", "No"] },
  { id: 8, text: "Work/study hours?", type: "integerInput" },
  { id: 9, text: "Financial stress (1-10)", type: "scale" },
  { id: 10, text: "Family history of mental illness?", options: ["Yes", "No"] },
]

export default function MentalHealthAssessment() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | { 
    hasPotentialDepression: boolean; 
    score: number; 
    message: string 
  }>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const goToNextQuestion = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1)
    } else {
      submitAssessment()
    }
  }

  const goToPrevQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const startAssessment = () => {
    setCurrentStep(1)
  }

  const submitAssessment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Prepare the data to send to the Flask server
      const assessmentData = {
        gender: answers[1],
        age: answers[2],
        academic_pressure: answers[3],
        study_satisfaction: answers[4],
        sleep_duration: answers[5],
        dietary_habits: answers[6],
        suicidal_thoughts: answers[7],
        work_study_hours: answers[8],
        financial_stress: answers[9],
        family_mental_history: answers[10]
      }

      // Make the Axios request to your Flask server
      const response = await axios.post('http://localhost:5000/check', assessmentData)

      // Set the result from the server response
      setResult({
        hasPotentialDepression: response.data.has_potential_depression,
        score: response.data.score,
        message: response.data.message || "Assessment completed."
      })

      // Move to the result screen
      setCurrentStep(questions.length + 1)
    } catch (error) {
      console.error("Error submitting assessment:", error)
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "An error occurred while submitting the assessment.")
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }

  const resetAssessment = () => {
    setCurrentStep(0)
    setAnswers({})
    setResult(null)
    setError(null)
  }

  const isLastQuestion = currentStep === questions.length
  const currentQuestion = questions[currentStep - 1]
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null
  const progress = (currentStep / (questions.length + 1)) * 100

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card className="bg-white dark:bg-gray-800 shadow-lg border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-0">
            <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-2">
              Student Mental Health Assessment
            </h1>
            <div className="h-1 w-20 bg-blue-500 mx-auto mb-6"></div>
          </div>

          {currentStep > 0 && currentStep <= questions.length && <ProgressBar progress={progress} />}

          <div className="p-6 min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              {currentStep === 0 && <WelcomeScreen onStart={startAssessment} />}

              {currentStep > 0 && currentStep <= questions.length && (
                <motion.div
                  key={`question-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <QuestionItem question={currentQuestion} answer={currentAnswer} onAnswer={handleAnswer} />

                  <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={goToPrevQuestion} disabled={currentStep === 1} className="px-6">
                      Previous
                    </Button>
                    <Button
                      onClick={goToNextQuestion}
                      disabled={currentAnswer === undefined || currentAnswer === null}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      {isLastQuestion ? "Submit" : "Next"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {currentStep === questions.length + 1 && (
                <ResultScreen 
                  result={result} 
                  onReset={resetAssessment} 
                  error={error} 
                />
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}