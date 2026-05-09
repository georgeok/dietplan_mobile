import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export function usePickAndUploadPhoto() {
  return useCallback(
    async (input: {
      planId: string;
      cycleDay: number;
      snapshotRecipeId: string;
    }): Promise<string | null> => {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return null;
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });
      if (picked.canceled || !picked.assets[0]) return null;
      const asset = picked.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const blob = await fetch(manipulated.uri).then((r) => r.blob());
      const path = `${input.planId}/${input.cycleDay}/${input.snapshotRecipeId}-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('tick-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return path;
    },
    [],
  );
}
