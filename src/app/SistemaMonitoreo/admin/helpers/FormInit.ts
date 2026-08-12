import { DynamicCreateModel } from "./ActionsHelper";
import { generateGuid } from "./Generators";

export function InitializeDefaultValues(createModel: DynamicCreateModel): Record<string, any> {
    return createModel.fields.reduce((form, field) => {

        switch (field.type) {

            case 'number':
                form[field.key] = +(Math.random() * (1500 - 200) + 200).toFixed(2);
                break;

            case 'int':
                form[field.key] = Math.floor(Math.random() * (75 - 3 + 1)) + 3;
                break;

            case 'select':
                const options = field.options ?? [];

                form[field.key] =
                    options.length > 0
                        ? options[Math.floor(Math.random() * options.length)].value
                        : '';

                break;

            case 'guid':
                form[field.key] = generateGuid();
                break;

            default:
                form[field.key] = '';
        }

        return form;

    }, {} as Record<string, any>);
}