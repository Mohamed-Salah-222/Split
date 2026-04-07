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

export type Assignment = {
  memberId: string;
  items: Item[];
};

export type Session = {
  id: string;
  groupId: string;
  createdAt: string;
  store: string | null;
  items: Item[];
  total: number;
  assignments: Assignment[];
  payerId: string;
  sentMessages: string[];
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
};
