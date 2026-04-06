export type Member = {
  id: string;
  name: string;
  phone: string;
  items: Item[];
};

export type Item = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Group = {
  id: string;
  name: string;
  creator: string;
  members: Member[];
  createdAt: string;
  sessionCount: number;
  lastSplit?: string;
};

export type CreateGroupInput = {
  name: string;
  creator: string;
  members: Member[];
  sessionCount: number;
};
0