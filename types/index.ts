export type Member = {
  name: string;
  phone: string;
};

export type Group = {
  id: string;
  name: string;
  creator: string;
  members: Member[];
  createdAt: string;
};

export type CreateGroupInput = {
  name: string;
  creator: string;
  members: Member[];
};
