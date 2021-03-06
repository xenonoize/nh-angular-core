import {Injectable} from "@angular/core";
import {FormGroup, FormControl, AbstractControl} from "@angular/forms";

export interface IServerSideFormValidationService{
}

@Injectable()
export class ServerSideFormValidationService implements IServerSideFormValidationService{

    public validate<T extends IServerSideFormValidator>(formValidatorType: { new(): T ;}, formGroup: FormGroup, objectToValidate: any): void {

        let formValidator = new formValidatorType();
        let formValidationResult: FormValidationResult = formValidator.validate(objectToValidate);

        if(!formValidationResult.hasErrors())
        {
            return;
        }

        if(!formGroup.controls[""])
        {
            formGroup.addControl("", new FormControl());
        }

        let formErrors = formValidationResult.getErrors();
        for(let i = 0; i < formErrors.length; i++)
        {
            let formError = formErrors[i];
            let formControl: FormControl = formValidator.getFormControlFromFormGroup(formGroup, formError.getFieldName());

            if(formControl == null)
            {
                formControl = <FormControl>formGroup.controls[""];
            }

            if(!formControl.errors)
            {
                formControl.setErrors({remote: formError.getErrorMessages()});
            }else{
                if(!formControl.errors.remote || formControl.errors.remote.length < 1)
                {
                    formControl.errors.remote = [];
                }

                for(let formErrorMessage of formError.getErrorMessages())
                {
                    formControl.errors.remote.push(formErrorMessage);
                }
            }
        }
    }
}

export interface IServerSideFormValidator {
    getFormControlFromFormGroup(formGroup: FormGroup, formControlKey: string) : FormControl;
    validate(object: any): FormValidationResult;
}
export class AspMvcFormServerSideFormValidator implements IServerSideFormValidator
{
    public getFormControlFromFormGroup(formGroup: FormGroup, formControlKey: string) : FormControl
    {
        const separator = '.';
        let formControl: FormControl = null;
        const formControlKeySplit = formControlKey.split(separator);

        if(formControlKeySplit.length == 1)
        {
            for (let key in formGroup.controls) {
                if (formGroup.controls.hasOwnProperty(key)) {
                    if(key.toLowerCase() == formControlKey.toLowerCase())
                    {
                        formControl = <FormControl>formGroup.controls[key];
                        break;
                    }
                }
            }
        }else if(formControlKeySplit.length > 1)
        {
            const baseKey = formControlKeySplit[0];
            const subKey = formControlKeySplit.filter(x => x !== baseKey).join(separator);

            for (let key in formGroup.controls) {
                if (formGroup.controls.hasOwnProperty(key)) {
                    if(key.toLowerCase() == baseKey.toLowerCase())
                    {
                        if(typeof formGroup.controls[key] === 'object')
                        {
                            formControl = this.getFormControlFromFormGroup(<FormGroup>formGroup.controls[baseKey], subKey);
                        }

                        break;
                    }
                }
            }
        }

        if(formControl == null)
        {
            formControl = <FormControl>formGroup.controls[""];
        }

        return formControl
    }

    public validate(object: any): FormValidationResult {
        let validationResult = new FormValidationResult();

        if(object && object != null)
        {
            if (object.error_description !== undefined) {
                validationResult.addErrorByFieldName("", object.error_description);
            }

            if (object.ModelState) {
                for (let key in object.ModelState) {

                    let errors = object.ModelState[key];
                    for (let subKey in errors) {
                        validationResult.addErrorByFieldName(key.replace("model.", ""), errors[subKey]);
                    }
                }
            }

            if (object.error) {
                for (let key in object.error) {

                    let errors = object.error[key];
                    for (let subKey in errors) {
                        validationResult.addErrorByFieldName(key, errors[subKey]);
                    }
                }
            }

            if (object.Message !== undefined) {
                validationResult.addErrorByFieldName("", object.Message);
            }
        }

        return validationResult;
    }
}

export interface IFormValidationResult {
}
export class FormValidationResult implements IFormValidationResult
{
    private formErrors: Array<FormError> = [];

    public getErrors(): Array<FormError>{
        return this.formErrors;
    }

    public hasErrors(): boolean{
        return (this.getErrors().length > 0);
    }

    public hasErrorForFieldName(fieldName: string): boolean{
        return (this.getErrorForFieldName(fieldName) !== null);
    }

    public getErrorForFieldName(fieldName: string): FormError{
        let formError: FormError = null;

        for(let i = 0; i < this.formErrors.length; i++)
        {
            if(this.formErrors[i].getFieldName() == fieldName)
            {
                formError = this.formErrors[i];
            }
        }

        return formError;
    }

    public addErrorByFieldName(fieldName: string, errorMessage: string): void {
        let formError: FormError = this.getErrorForFieldName(fieldName);

        if(formError == null)
        {
            formError = new FormError(fieldName);
            this.formErrors.push(formError);
        }

        formError.addErrorMessage(errorMessage);
    }

    constructor() {
    }
}

export interface IFormError {
}
export class FormError implements IFormError
{
    private fieldName:string;
    private errorMessages:Array<string> = [];

    public getErrorMessages(): Array<string> {
        return this.errorMessages;
    }

    public getFieldName(): string{
        return this.fieldName;
    }

    public addErrorMessage(errorMessage: string): void {
        this.errorMessages.push(errorMessage);
    }

    private setFieldName(fieldName: string): void{
        if(!fieldName || fieldName == null)
        {
            fieldName = '';
        }

        this.fieldName = fieldName;
    }

    constructor(fieldName:string) {
        this.setFieldName(fieldName);
    }
}