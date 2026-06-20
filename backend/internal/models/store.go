package models

import (
	"github.com/anshdav0/Storm-of-Swords.git/backend/internal/db"
)

// Constructor to initialize everything in one shot
type PlayerStore struct {
	store *db.Store
}

type BuildingStore struct {
	store *db.Store
}

type VillageStore struct {
	store *db.Store
}

type TroopStore struct {
	store *db.Store
}

type BattleStore struct {
	store *db.Store
}

func NewPlayerStore(store *db.Store) *PlayerStore {
	return &PlayerStore{store: store}
}

func NewBuildingStore(store *db.Store) *BuildingStore {
	return &BuildingStore{store: store}
}

func NewVillageStore(store *db.Store) *VillageStore {
	return &VillageStore{store: store}
}

func NewTroopStore(store *db.Store) *TroopStore {
	return &TroopStore{store: store}
}

func NewBattleStore(store *db.Store) *BattleStore {
	return &BattleStore{store: store}
}
