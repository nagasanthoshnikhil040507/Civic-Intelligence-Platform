import React from 'react';
import { useForm, FormProvider, UseFormReturn, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';

interface FormWrapperProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  defaultValues?: Partial<T>;
  className?: string;
}

export function FormWrapper<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  className,
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className={className}>
        {children(methods)}
      </form>
    </FormProvider>
  );
}
