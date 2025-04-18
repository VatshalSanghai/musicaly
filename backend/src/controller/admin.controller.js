import {Song} from "../models/song.model.js";
import {Album} from "../models/album.model.js";

//helper function to upload files to cloudinary
import cloudinary from "../lib/cloudinary.js";

const uploadToCloudinary = async (file) => {
    try{
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto"
        });
        return result.secure_url;
    }catch(err){
        console.log("uploading error ", err);
        throw new Error("Error uploading file to cloudinary");
    }
}

export const createSong = async (req, res, next) => {
    try{
        if(!req.files || !req.files.imageFile || !req.files.audioFile){
            return res.status(400).json({error:"Please upload all the required files"})
        }
        const {title, artist, albumId, duration} = req.body;
        const imageFile = req.files.imageFile;
        const audioFile = req.files.audioFile;

        const audioUrl = await  uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const song = new Song({
            title,
            artist,
            audioUrl,
            imageUrl, 
            duration,
            albumId: albumId || null,
        });

        await song.save();

        if(albumId){
           await Album.findByIdAndUpdate(albumId,{
                $push: {songs: song._id}
           });
        }
        res.status(201).json({success:true, message: "Song created successfully"});
    }catch(err){
        console.log(err);
       next(err);
    }
}

export const deleteSong = async (req, res, next) => {
    try{
        const {id} = req.params;
        const song = await Song.findById(id);
       
        //delete song from an album if exists
        if(song.albumId){
            await Album.findByIdAndUpdate(song.albumId, {
                $pull: {songs: song._id}
            });
        }
        await Song.findByIdAndDelete(id);
        res.status(200).json({success:true, message: "Song deleted successfully"});
    }catch(err){
        console.log("delete song controller error",err);
        next(err);
    }
}

export const createAlbum = async (req, res, next) => {
    try{
      
        const {title, artist, releaseYear} = req.body;
        const{ imageFile} = req.files;

        const imageUrl = await uploadToCloudinary(imageFile);

        const album = new Album({
            title,
            artist,
            imageUrl,
            releaseYear,
        });

        await album.save();
        res.status(201).json({success:true, message: "Album created successfully"});
    }
    catch(err){
        console.log("error in creating album in admin controller",err);
        next(err);
    }
}; 

export const deleteAlbum = async (req, res, next) => {
    try{
        const {id} = req.params;
        await Song.deleteMany({albumId: id});
        await Album.findByIdAndDelete(id);
        res.status(200).json({success:true, message: "Album deleted successfully"});
    }catch(err){
        console.log("delete album controller error",err);
        next(err);
    }
};

export const checkAdmin = (req, res,next) => {
    res.status(200).json({admin:true} );
};