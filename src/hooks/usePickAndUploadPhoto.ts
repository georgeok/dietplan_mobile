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
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });
      if (picked.canceled || !picked.assets[0]) return null;
      const asset = picked.assets[0];

      // expo-image-manipulator SDK 55 context API.
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize({ width: 1280 });
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const blob = await fetch(result.uri).then((r) => r.blob());
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
