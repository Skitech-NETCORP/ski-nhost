import ControlledSelect from '@/components/common/ControlledSelect';
import { useDialog } from '@/components/common/DialogProvider';
import Form from '@/components/common/Form';
import useDatabaseQuery from '@/hooks/dataBrowser/useDatabaseQuery';
import type { DatabaseColumn, ForeignKeyRelation } from '@/types/data-browser';
import Button from '@/ui/v2/Button';
import Divider from '@/ui/v2/Divider';
import Option from '@/ui/v2/Option';
import Text from '@/ui/v2/Text';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import * as Yup from 'yup';
import ReferencedColumnSelect from './ReferencedColumnSelect';
import ReferencedSchemaSelect from './ReferencedSchemaSelect';
import ReferencedTableSelect from './ReferencedTableSelect';

export interface BaseForeignKeyFormValues extends ForeignKeyRelation {
  /**
   * Determines whether or not the origin column selector should be disabled.
   */
  disableOriginColumn?: boolean;
}

export interface BaseForeignKeyFormProps {
  /**
   * Available columns in the table.
   */
  availableColumns?: DatabaseColumn[];
  /**
   * Function to be called when the form is submitted.
   */
  onSubmit: (values: BaseForeignKeyFormValues) => Promise<void>;
  /**
   * Function to be called when the operation is cancelled.
   */
  onCancel?: VoidFunction;
  /**
   * Submit button text.
   *
   * @default 'Save'
   */
  submitButtonText?: string;
}

export const baseForeignKeyValidationSchema = Yup.object().shape({
  columnName: Yup.string().nullable().required('This field is required.'),
  referencedSchema: Yup.string().nullable().required('This field is required.'),
  referencedTable: Yup.string().nullable().required('This field is required.'),
  referencedColumn: Yup.string().nullable().required('This field is required.'),
  updateAction: Yup.string()
    .nullable()
    .required('This field is required.')
    .oneOf(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']),
  deleteAction: Yup.string()
    .nullable()
    .required('This field is required.')
    .oneOf(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']),
});

export function BaseForeignKeyForm({
  availableColumns,
  onSubmit: handleExternalSubmit,
  onCancel,
  submitButtonText = 'Save',
}: BaseForeignKeyFormProps) {
  const { onDirtyStateChange } = useDialog();

  const router = useRouter();
  const {
    query: { dataSourceSlug },
  } = router;

  const { getValues } = useFormContext();
  const { dirtyFields, errors, isSubmitting } =
    useFormState<BaseForeignKeyFormValues>();

  const disableOriginColumn = getValues('disableOriginColumn');

  const { data } = useDatabaseQuery([dataSourceSlug]);
  const { schemas, tables } = data || { schemas: [], tables: [] };

  // react-hook-form's isDirty gets true even if an input field is focused, then
  // immediately unfocused - we can't rely on that information
  const isDirty = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    onDirtyStateChange(isDirty, 'dialog');
  }, [isDirty, onDirtyStateChange]);

  return (
    <Form
      onSubmit={(values) => {
        const selectedColumn = availableColumns?.find(
          (column) => column.name === values.columnName,
        );

        return handleExternalSubmit({
          ...values,
          oneToOne:
            selectedColumn?.isPrimary || selectedColumn?.isUnique || false,
        });
      }}
      className="flex flex-auto flex-col content-between overflow-hidden pb-4"
    >
      <div className="grid flex-auto grid-flow-row gap-4 overflow-y-auto border-t-1 border-t-gray-200 px-6 py-4">
        <section className="grid grid-flow-row gap-4">
          <Text variant="h3">From</Text>

          <ControlledSelect
            id="columnName"
            name="columnName"
            label="Column"
            fullWidth
            placeholder="Select a column"
            hideEmptyHelperText
            error={Boolean(errors.columnName)}
            helperText={errors.columnName?.message}
            autoFocus={!disableOriginColumn}
            disabled={disableOriginColumn}
          >
            {availableColumns?.map(({ name }) => (
              <Option value={name} key={name}>
                {name}
              </Option>
            ))}
          </ControlledSelect>

          <Divider />
        </section>

        <section className="grid grid-flow-row gap-4">
          <Text variant="h3">To</Text>

          <ReferencedSchemaSelect
            options={schemas}
            autoFocus={disableOriginColumn}
          />
          <ReferencedTableSelect options={tables} />
          <ReferencedColumnSelect />

          <Divider />
        </section>

        <section className="grid grid-cols-2 gap-4">
          <ControlledSelect
            id="updateAction"
            name="updateAction"
            label="On Update"
            fullWidth
            hideEmptyHelperText
            error={Boolean(errors.updateAction)}
            helperText={errors.updateAction?.message}
            className="col-span-1"
          >
            <Option value="RESTRICT">RESTRICT</Option>
            <Option value="CASCADE">CASCADE</Option>
            <Option value="SET NULL">SET NULL</Option>
            <Option value="SET DEFAULT">SET DEFAULT</Option>
            <Option value="NO ACTION">NO ACTION</Option>
          </ControlledSelect>

          <ControlledSelect
            id="deleteAction"
            name="deleteAction"
            label="On Delete"
            fullWidth
            hideEmptyHelperText
            error={Boolean(errors.deleteAction)}
            helperText={errors.deleteAction?.message}
            className="col-span-1"
          >
            <Option value="RESTRICT">RESTRICT</Option>
            <Option value="CASCADE">CASCADE</Option>
            <Option value="SET NULL">SET NULL</Option>
            <Option value="SET DEFAULT">SET DEFAULT</Option>
            <Option value="NO ACTION">NO ACTION</Option>
          </ControlledSelect>
        </section>
      </div>

      <div className="grid flex-shrink-0 grid-flow-row gap-2 border-t-1 border-t-gray-200 px-6 pt-4">
        <Button loading={isSubmitting} disabled={isSubmitting} type="submit">
          {submitButtonText}
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          tabIndex={isDirty ? -1 : 0}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
