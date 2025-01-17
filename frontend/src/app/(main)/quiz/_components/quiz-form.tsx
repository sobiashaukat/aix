'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { UserFileResponse } from '@/components/actions/document';
import { fetchDocuments } from '@/components/actions/fetch-document';
import { generateQuiz } from '@/components/actions/quiz';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect, OptionType } from '@/components/ui/multiselect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { QUERY_KEY } from '@/lib/constants';
import { convertMinutesTimeDelta } from '@/lib/utils';
import { useFileUploadStore } from '@/store/fileupload-store';
import { Generate } from '@/type/quiz';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	QuizGenerateRequest,
	QuizGenerateValidator,
	difficultyLevels,
	questionTypes,
} from './utils';

interface QuizGenerateFormProps {
	initialDocument: UserFileResponse;
}

export function QuizeForm({ initialDocument }: QuizGenerateFormProps) {
	const router = useRouter();
	const { isDrawerOpen, setIsDrawerOpen } = useFileUploadStore();

	const form = useForm<QuizGenerateRequest>({
		resolver: zodResolver(QuizGenerateValidator),
		defaultValues: {
			title: '',
			file_ids: [],
			time_limit: undefined,
			total_questions_to_generate: undefined,
			questions_type: [],
			difficulty: undefined,
			user_prompt: '',
		},
	});

	const { data, isLoading, error } = useInfiniteQuery({
		queryKey: [QUERY_KEY.DOCUMENTS],
		queryFn: fetchDocuments,
		initialPageParam: 1,
		getNextPageParam: (_, pages) => pages.length + 1,
		initialData: {
			pages: [initialDocument],
			pageParams: [1],
		},
	});

	if (isLoading || error) {
		return <div>Loading...</div>;
	}

	const document = data?.pages.flatMap((page) => page.data);

	const documents: OptionType[] =
		document?.map((item: { id: string; file_name: string }) => ({
			value: item.id,
			label: item.file_name,
		})) ?? [];

	async function onSubmit(data: QuizGenerateRequest) {
		try {
			const timeDelta = convertMinutesTimeDelta(data?.time_limit);

			const payload: Generate = {
				title: data.title,
				time_limit: timeDelta,
				total_questions_to_generate: Number(data.total_questions_to_generate),
				questions_type: data.questions_type,
				difficulty: data.difficulty,
				user_prompt: data.user_prompt,
				user_file_ids: data.file_ids,
			};

			const res = await generateQuiz(payload);

			if (res.error) {
				toast('Failed to generate quiz', {
					description: res.error,
				});
				return;
			}

			toast('Quiz Generated Successfully', {
				description: data.title,
			});
			form.reset();
			router.push(`/quiz`);
		} catch (error) {
			console.log('Error', error);
			toast('Failed to generate quiz', {
				description: 'An error occurred while generating the quiz.',
			});
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-6 text-left max-w-sm w-full'
			>
				<h1 className='font-semibold text-xl md:text-2xl underline underline-offset-8'>
					Generate a Quiz
				</h1>

				<FormField
					control={form.control}
					name='title'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input
									placeholder='Quiz Title'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='file_ids'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Documents</FormLabel>
							<MultiSelect
								selected={field.value}
								options={documents}
								{...field}
								className='w-[290px] sm:w-[384px]'
							/>
							<FormDescription>
								Can&apos;t find the document you are looking for?{' '}
								<Button
									className='font-semibold text-gray-500 hover:underline p-0 h-fit'
									variant={'link'}
									type='button'
									onClick={() => setIsDrawerOpen(!isDrawerOpen)}
								>
									Upload a new document
								</Button>
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='time_limit'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Quiz Duration (in minutes)</FormLabel>
							<FormControl>
								<Input
									type='number'
									placeholder='Enter the time for the quiz.'
									min={1}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='questions_type'
					render={() => (
						<FormItem>
							<div className='mb-4'>
								<FormLabel className='text-base'>Question Types</FormLabel>
								<FormDescription>
									Select the type of questions you want to include in the quiz.
								</FormDescription>
							</div>
							{questionTypes.map((item) => (
								<FormField
									key={item.id}
									control={form.control}
									name='questions_type'
									render={({ field }) => {
										return (
											<FormItem
												key={item.id}
												className='flex flex-row items-start space-x-3 space-y-0'
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
												<FormLabel className='font-normal'>
													{item.label}
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

				<FormField
					control={form.control}
					name='total_questions_to_generate'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Number of Questions</FormLabel>
							<FormControl>
								<Input
									type='number'
									placeholder='Enter the number of questions.'
									min={1}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='difficulty'
					render={({ field }) => (
						<FormItem className='space-y-3'>
							<FormLabel>
								Select the difficulty level for the questions
							</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value}
									className='flex flex-col space-y-1'
								>
									{difficultyLevels.map((level) => (
										<FormItem
											key={level.value}
											className='flex items-center space-x-3 space-y-0'
										>
											<FormControl>
												<RadioGroupItem value={level.value} />
											</FormControl>
											<FormLabel className='font-normal'>
												{level.label}
											</FormLabel>
										</FormItem>
									))}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name='user_prompt'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Quiz Instructions</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Enter instructions to generate the quiz.'
									className='resize-none'
									{...field}
								/>
							</FormControl>
							<FormDescription>
								Enter the instructions for the quiz. You can use markdown
								formatting.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					className='w-full'
					type='submit'
					disabled={form.formState.isSubmitting || !form.formState.isValid}
					isLoading={form.formState.isSubmitting}
				>
					Generate Quiz
				</Button>
			</form>
		</Form>
	);
}
