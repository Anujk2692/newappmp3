export type MediaStackParamList = {
  Search: undefined;
  Player: {
    item?: import('../api/client').MediaItem;
    media?: import('../api/client').PlayableMedia;
    streamUrl: string;
  };
};

export type FaceStackParamList = {
  FaceHome: undefined;
  RegisterFace: undefined;
  IdentifyFace: undefined;
  PersonPhotos: {personId: string; personName: string};
};

export type RootTabParamList = {
  Media: undefined;
  Faces: undefined;
};
