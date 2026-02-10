export enum GameObjectType{
    LivingEntity=1,
    Shape,
    Tank,
    Bullet
}

export enum GameColors{
    Blue,
    Red,
    Green,
    Yellow,

    Barrel,

    Shiny,
    Mythical,
    Legendary,
    BlackShape,

    Egg,
    Triangle,
    Square,
    Pentagon,
    Hexagon,

    Guardian,
    OriginalBoss,

    Grid,
    Background,

    Text,
    HealthBar,
    HealthBarBackground
}

export enum PlayerAttributes{
    MaxHealth=0,
    HealthRegen,
    MoveSpeed,
    BodyDamage,
    BulletDamage,
    BulletHealth,
    BulletSpeed,
    Reload,
}

export const PlayerAttributesMult:Record<PlayerAttributes,number>={
    [PlayerAttributes.MaxHealth]:0.15,
    [PlayerAttributes.HealthRegen]:0.006,
    [PlayerAttributes.BodyDamage]:0.2,
    [PlayerAttributes.MoveSpeed]:0.04,
    [PlayerAttributes.BulletDamage]:0.2,
    [PlayerAttributes.BulletHealth]:0.75,
    [PlayerAttributes.BulletSpeed]:0.15,
    [PlayerAttributes.Reload]:0.15,
}

export const zero_player_attributes:Record<PlayerAttributes,number>={
    [PlayerAttributes.MaxHealth]:0,
    [PlayerAttributes.HealthRegen]:0,
    [PlayerAttributes.MoveSpeed]:0,
    [PlayerAttributes.BodyDamage]:0,
    [PlayerAttributes.BulletDamage]:0,
    [PlayerAttributes.BulletHealth]:0,
    [PlayerAttributes.BulletSpeed]:0,
    [PlayerAttributes.Reload]:0,
}
export enum ArenaLogs{
    Join,
    Kill,
}
export type ArenaLog={
    type:ArenaLogs.Join,
}|{
    type:ArenaLogs.Kill,
    obj_1:string,
    obj_2:string,
}

export const GameConstant={
    level_base:5,
    level_increse:14,
}