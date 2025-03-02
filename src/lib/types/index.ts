export type TBranding = {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
};

export type TApp = {
  name: string;
  description: string;
  author: string;
  branding: TBranding;
  apiEndpoint: string;
};

export type TValidation = {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  zodString: string;
};

export type TField = {
  name: string;
  type: "text" | "email" | "password" | "textarea" | "date" | "hidden" | "number";
  required?: boolean;
  validation: TValidation;
  options?: string[];
};

export type TColumn = {
  field: string;
  label: string;
};

export type TDrawer = {
  title: string;
  size: "small" | "medium" | "large";
  graphqlHook: string;
  fields: TField[];
};

export type TResponseTypeProperty = {
  type: string;
};

export type TResponseType = {
  type: "object";
  properties: {
    [key: string]: TResponseTypeProperty;
  };
};

export type TAuthAPIType = "login" | "currentUser";
export type TListingAPIType = "list" | "create" | "update" | "delete" | "getById";
export type TAPIType = TAuthAPIType | TListingAPIType;

export type TAPI = {
  type?: TAPIType;
  graphqlHook: string;
  queryString: string;
  responseType?: TResponseType;
};

export type TAuthPage = {
  type: "EmailPassword" | "Phone" | "VerifyOtp" | "ForgotPassword" | "ResetPassword";
  name: string;
  route: string;
  isPrivate: boolean;
  api: TAPI[];
  fields?: TField[];
};

export type TListingPage = {
  type: "Listing" | "Detail";
  name: string;
  route: string;
  isPrivate: boolean;
  api?: TAPI[];
  graphqlHook?: string;
  returnTypeName?: string;
  columns: TColumn[];
  actions: ("create" | "edit" | "delete")[];
  drawerCreate: TDrawer;
  drawerUpdate: TDrawer;
};

export type TPage = TAuthPage | TListingPage;

export type TModule = {
  name: string;
  pages: TPage[];
};

export type TRequirement = {
  app: TApp;
  modules: TModule[];
};
