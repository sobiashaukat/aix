"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { saveQuizAnswer } from "@/components/actions/attempt";
import { QuizProgress } from "./quiz-progress";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export interface QuizMultiselectQuestionProps {
  question_text: string;
  question_type:
    | "single_select_mcq"
    | "multi_select_mcq"
    | "open_text_question";
  mcq_options: {
    id: string;
    option_text: string;
  }[];
  total_questions: number;
  current_question: number;
  handleSubmit: () => void;
  attempt_id: string;
  question_id: string;
  isLastQuestion: boolean;
}

export const QuizMultiselectQuestion = ({
  mcq_options,
  question_text,
  question_type,
  current_question,
  total_questions,
  handleSubmit,
  attempt_id,
  question_id,
  isLastQuestion,
}: QuizMultiselectQuestionProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const FormSchema = z.object({
    selectedOptions: z.array(
      z.string({ required_error: "You need to select at least one option." })
    ),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedOptions: [],
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);

      const res = await saveQuizAnswer({
        attemptId: attempt_id,
        questionType: question_type,
        selectedOptions: data.selectedOptions,
        questionId: question_id,
      });

      if (res.error) {
        console.error("Error submitting answer:", res.error);
        return;
      }

      console.log("Answer submitted:", res.data);

      handleSubmit();

      form.reset();
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="selectedOptions"
            render={() => (
              <FormItem className="space-y-3 flex flex-col">
                <FormLabel className="text-lg font-semibold mb-4 text-left w-11/12 mx-auto">
                  {question_text}
                </FormLabel>
                {mcq_options.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="selectedOptions"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0 w-10/12 mx-auto"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.option_text}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse gap-y-5 md:gap-y-0 md:flex-row items-center justify-center w-full space-x-4 md:space-x-6 lg:space-x-8 pt-10">
            <QuizProgress
              currentQuestion={current_question}
              totalQuestions={total_questions}
            />
            <Button
              className="px-6 md:px-8 lg:px-10 h-9"
              size="default"
              type="submit"
              disabled={!form.formState.isValid || isLoading}
              isLoading={isLoading || form.formState.isSubmitting}
            >
              {isLastQuestion ? "Submit Quiz" : "Next Question"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export interface QuizOpentextQuestionProps {
  question_text: string;
  question_type:
    | "single_select_mcq"
    | "multi_select_mcq"
    | "open_text_question";
  mcq_options: {
    id: string;
    option_text: string;
  }[];
  total_questions: number;
  current_question: number;
  handleSubmit: () => void;
  attempt_id: string;
  question_id: string;
  isLastQuestion: boolean;
}

export const QuizOpentextQuestion = ({
  question_text,
  question_type,
  current_question,
  total_questions,
  handleSubmit,
  attempt_id,
  question_id,
  isLastQuestion,
}: QuizOpentextQuestionProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const FormSchema = z.object({
    freeformAnswer: z.string({
      required_error: "You need to provide an answer.",
    }),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      const res = await saveQuizAnswer({
        attemptId: attempt_id,
        questionType: question_type,
        answerText: data.freeformAnswer,
        questionId: question_id,
      });

      if (res.error) {
        console.error("Error submitting answer:", res.error);
        return;
      }

      console.log("Answer submitted:", res.data);
      form.setValue("freeformAnswer", "");
      form.reset();
      handleSubmit();
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="freeformAnswer"
            render={({ field }) => (
              <FormItem className="space-y-3 flex flex-col">
                <FormLabel className="text-lg font-semibold mb-4 text-left w-11/12 mx-auto">
                  {question_text}
                </FormLabel>
                {question_type === "open_text_question" && (
                  <FormControl>
                    <Textarea
                      placeholder="Type your answer here..."
                      className="h-40 w-11/12 mx-auto"
                      {...field}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col-reverse gap-y-5 md:gap-y-0 md:flex-row items-center justify-center w-full space-x-4 md:space-x-6 lg:space-x-8 pt-10">
            <QuizProgress
              currentQuestion={current_question}
              totalQuestions={total_questions}
            />
            <Button
              className="px-6 md:px-8 lg:px-10 h-9"
              size="default"
              type="submit"
              disabled={!form.formState.isValid || isLoading}
              isLoading={isLoading || form.formState.isSubmitting}
            >
              {isLastQuestion ? "Submit Quiz" : "Next Question"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

interface QuizSingleSelectQuestionProps {
  question_text: string;
  question_type:
    | "single_select_mcq"
    | "multi_select_mcq"
    | "open_text_question";
  mcq_options: {
    id: string;
    option_text: string;
  }[];
  total_questions: number;
  current_question: number;
  handleSubmit: () => void;
  attempt_id: string;
  question_id: string;
  isLastQuestion: boolean;
}

export const QuizSingleSelectQuestion = ({
  mcq_options,
  question_text,
  question_type,
  current_question,
  total_questions,
  handleSubmit,
  attempt_id,
  question_id,
  isLastQuestion,
}: QuizSingleSelectQuestionProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const FormSchema = z.object({
    selectedOption: z.enum(
      [
        // @ts-ignore
        mcq_options[0].id,
        // @ts-ignore
        mcq_options[1].id,
        // @ts-ignore
        mcq_options[2].id,
        // @ts-ignore
        mcq_options[3].id,
      ],

      {
        required_error: "You need to select an option.",
      }
    ),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      const res = await saveQuizAnswer({
        attemptId: attempt_id,
        questionType: question_type,
        selectedOptions: [data.selectedOption],
        questionId: question_id,
      });

      if (res.error) {
        console.error("Error submitting answer:", res.error);
        return;
      }

      console.log("Answer submitted:", res.data);
      form.reset();
      handleSubmit();
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="selectedOption"
            render={({ field }) => (
              <FormItem className="space-y-3 flex flex-col">
                <FormLabel className="text-lg font-semibold mb-4 text-left w-11/12 mx-auto">
                  {question_text}
                </FormLabel>
                {question_type !== "open_text_question" && (
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 w-10/12 mx-auto"
                    >
                      {mcq_options.map((option) => (
                        <FormItem
                          key={option.id}
                          className="flex items-center space-x-3 space-y-0 text-gray-950"
                        >
                          <FormControl>
                            <RadioGroupItem value={option.id} />
                          </FormControl>
                          <FormLabel className="font-normal text-base text-left">
                            {option.option_text}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col-reverse gap-y-5 md:gap-y-0 md:flex-row items-center justify-center w-full space-x-4 md:space-x-6 lg:space-x-8 pt-10">
            <QuizProgress
              currentQuestion={current_question}
              totalQuestions={total_questions}
            />
            <Button
              className="px-6 md:px-8 lg:px-10 h-9"
              size="default"
              type="submit"
              disabled={!form.formState.isValid || isLoading}
              isLoading={isLoading || form.formState.isSubmitting}
            >
              {isLastQuestion ? "Submit Quiz" : "Next Question"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
