import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChatroomRepository } from './chatroom.repository';
import { Member } from '../member/member.entity';
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { Chatroom } from './chatroom.entity';
import { Transactional } from 'typeorm-transactional';
import { Game } from '../game/game.entity';
import { GameService } from '../game/game.service';
import { MemberChatroom } from '../member-chatroom/member-chatroom.entity';
import { MemberChatroomService } from '../member-chatroom/member-chatroom.service';

@Injectable()
export class ChatroomService {
  private logger = new Logger(ChatroomService.name);

  constructor(
    private readonly chatroomRepository: ChatroomRepository,
    private readonly gameService: GameService,
    private readonly memberChatroomService: MemberChatroomService,
  ) {}

  /**
   * method for creating new chatroom
   * @param member member
   * @param createChatroomDto gameId, title, preferTeam
   * @returns created chatroom
   */
  @Transactional()
  async createChatroom(
    member: Member,
    createChatroomDto: CreateChatroomDto,
  ): Promise<Chatroom> {
    // destruct DTO
    const { gameId, title, preferTeam } = createChatroomDto;

    // validate game if it exist
    const game: Game = await this.gameService.validateGameById(gameId);

    this.logger.debug(`game with id: ${game.id} has been found.`);

    // create the new chatroom
    const chatroom: Chatroom = await this.chatroomRepository.createChatroom(
      member,
      game,
      title,
      preferTeam,
    );

    this.logger.debug(
      `chatroom with (id: ${chatroom.id}, title: ${chatroom.title}, participation: ${chatroom.participantCount}) has been created.`,
    );

    // if the chatroom has created, the creator needs to be participated in
    const memberChatroom: MemberChatroom =
      await this.memberChatroomService.joinMemberToChatroom(member, chatroom);

    this.logger.debug(
      `memberChatroom with id: ${memberChatroom.id} has been created.`,
    );

    // return the chatroom information
    return chatroom;
  }

  /**
   * method for finding chatroom by its id
   * @param chatroomId chatroom's id
   * @returns found chatroom
   */
  async validateChatroomById(chatroomId: number): Promise<Chatroom> {
    const chatroom: Chatroom =
      await this.chatroomRepository.findChatroomById(chatroomId);

    if (!chatroom) {
      throw new NotFoundException(
        `Chatroom with id: ${chatroomId} has not found`,
      );
    }

    return chatroom;
  }

  /**
   * method for joining the member to the specified chatroom
   * @param member Member instance
   * @param chatroomId chatroom's id
   */
  @Transactional()
  async joinChatroom(member: Member, chatroomId: number): Promise<void> {
    // find and validate the chatroom
    const chatroom: Chatroom = await this.validateChatroomById(chatroomId);

    // if chatroom has reached its capacity, throw Conflict exception
    if (chatroom.participantCount >= 20) {
      throw new ConflictException(
        `Chatroom id: ${chatroomId} has reached its capacity`,
      );
    }

    // find and early return if member has already joined the chatroom
    let memberChatroom: MemberChatroom =
      await this.memberChatroomService.findMemberChatroomByMemberAndChatroom(
        member,
        chatroom,
      );

    if (memberChatroom) {
      this.logger.debug(
        `MemberChatroom already exists: ${JSON.stringify(memberChatroom)}`,
      );
      return;
    }

    // join member to the chatroom
    memberChatroom = await this.memberChatroomService.joinMemberToChatroom(
      member,
      chatroom,
    );

    // increment chatroom's participant count
    const participantCount: number =
      await this.chatroomRepository.incrementParticipantCount(chatroom.id);

    this.logger.debug(`updated partipant count: ${participantCount}`);

    this.logger.debug(
      `MemberChatroom has created: ${JSON.stringify(memberChatroom)}`,
    );
  }

  /**
   * method for leaving the member from the chatroom
   * @param member Member instance
   * @param chatroomId chatroom's id
   */
  @Transactional()
  async leaveChatroom(member: Member, chatroomId: number): Promise<void> {
    // find and validate chatroom
    const chatroom: Chatroom = await this.validateChatroomById(chatroomId);

    // find and early return if member has already left the chatroom
    const memberChatroom: MemberChatroom =
      await this.memberChatroomService.findMemberChatroomByMemberAndChatroom(
        member,
        chatroom,
      );

    if (!memberChatroom) {
      return;
    }

    this.logger.debug(
      `Member has participated the chatroom: ${JSON.stringify(memberChatroom)}`,
    );

    // leave the member from the chatroom
    await this.memberChatroomService.leaveMemberFromChatroom(member, chatroom);

    // decrement the participant count
    const participantCount: number =
      await this.chatroomRepository.decrementParticipantCount(chatroom.id);

    this.logger.debug(`updated partipant count: ${participantCount}`);

    // if all member has left, delete the chatroom
    if (participantCount <= 0) {
      await this.chatroomRepository.deleteChatroomById(chatroomId);
    }
  }

  /**
   * method for editing chatroom's title
   * @param member Member entity
   * @param chatroomId chatroom's id
   * @param title chatroom's new title
   * @returns updated Chatroom entity
   */
  async editChatroomTitle(
    member: Member,
    chatroomId: number,
    title: string,
  ): Promise<Chatroom> {
    // validate the chatroom
    const chatroom: Chatroom = await this.validateChatroomById(chatroomId);
    this.logger.debug(`chatroom: ${JSON.stringify(chatroom)}`);

    // if the creator is not the member, throw Forbidden exception
    const creator: Member = await chatroom.creator;
    this.logger.debug(`creator: ${JSON.stringify(creator)}`);
    if (creator.id !== member.id) {
      throw new ForbiddenException('Member cannot edit the title');
    }

    // change the title
    return this.chatroomRepository.updateChatroomTitle(chatroom, title);
  }

  /**
   * method for deleting the specified chatroom
   * @param member Member entity
   * @param chatroomId chatroom's id
   */
  async deleteChatroom(member: Member, chatroomId: number): Promise<void> {
    // find the chatroom
    const chatroom: Chatroom =
      await this.chatroomRepository.findChatroomById(chatroomId);

    // if it does not exist, ealry return to satisfy itempotency
    if (!chatroom) {
      return;
    }

    // if the creator is not the member, throw Forbidden exception
    const creator: Member = await chatroom.creator;
    if (creator.id !== member.id) {
      throw new ForbiddenException('Member cannot delete the chatroom');
    }

    // delete the chatroom
    this.chatroomRepository.deleteChatroomById(chatroom.id);
  }

  /**
   * method for finding chatrooms by game's id
   * @param gameId game's id
   * @returns found chatrooms
   */
  async findChatroomsByGameId(gameId: number): Promise<Chatroom[]> {
    return this.chatroomRepository.findChatroomsByGameId(gameId);
  }

  /**
   * method for finding chatrooms the member belonged to
   * @param member Member entity
   * @returns found chatrooms
   */
  async findChatroomsByMember(member: Member): Promise<Chatroom[]> {
    // find MemberChatroom information
    const memberChatrooms: MemberChatroom[] =
      await this.memberChatroomService.findMemberChatroomsByMember(member);

    // extract only the chatroom's information
    const chatrooms: Chatroom[] = memberChatrooms.map((memberChatroom) => {
      return memberChatroom.chatroom;
    });

    return chatrooms;
  }
}
