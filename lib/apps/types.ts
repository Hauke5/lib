import { HTMLAttributes, ReactNode }  from 'react';

export const  ALL_USERS  = 'public';


export enum Role {
   Admin    = 'Admin',
   Owner    = 'Owner',
   Public   = 'Public',
   Unknown  = 'Unknown',
}

export const defaultRole:RoleDesc = {
   public: Role.Public
}

export type RoleDesc = {
   [username:string]: Role
}


export interface LayoutProps extends ChildrenOnlyProps {
}

export type BaseProps = HTMLAttributes<HTMLElement>
export type ChildrenOnlyProps = {
   children: ReactNode;
}



